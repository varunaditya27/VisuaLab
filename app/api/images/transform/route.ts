import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'
import { r2PutObject, r2GetObjectBuffer } from '@/lib/r2'
import { promises as fs } from 'fs'
import path from 'path'
import { getSessionInfo } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const OpsSchema = z.object({
  imageId: z.string().min(1),
  rotate: z.number().optional(),
  flip: z.boolean().optional(),
  flop: z.boolean().optional(),
  crop: z
    .object({ x: z.number(), y: z.number(), width: z.number().positive(), height: z.number().positive() })
    .optional(),
  smartCrop: z
    .object({ ratio: z.enum(['1:1', '4:3', '3:2', '16:9']) })
    .optional(),
  resize: z
    .object({ width: z.number().positive().optional(), height: z.number().positive().optional(), fit: z.enum(['cover', 'contain', 'inside', 'outside']).optional() })
    .optional(),
  enhance: z
    .object({ normalize: z.boolean().optional(), sharpen: z.boolean().optional(), saturation: z.number().min(0.1).max(3).optional() })
    .optional(),
  preview: z.boolean().optional(),
  previewMaxWidth: z.number().positive().max(2000).optional(),
})

async function readOriginalBuffer(r2Key: string): Promise<Buffer> {
  // R2 keys we store as either 'images/...' or '/images/...'
  const isLocal = r2Key.startsWith('/')
  if (isLocal) {
    const filePath = path.join(process.cwd(), 'public', r2Key)
    return fs.readFile(filePath)
  }
  const bucket = process.env.R2_BUCKET!
  const key = r2Key
  return r2GetObjectBuffer(bucket, key)
}

export async function POST(req: Request) {
  const { userId, role } = await getSessionInfo()
  if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = OpsSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const { imageId, rotate, flip, flop, crop, smartCrop, resize, enhance, preview, previewMaxWidth } = parsed.data

  // Load image and authorize
  const image = await prisma.image.findUnique({ where: { id: imageId }, select: { id: true, userId: true, r2Key: true, thumbKey: true, responsive: true, mime: true } })
  if (!image) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // Added debug logging for auth failure
  if (!(role === 'ADMIN' || role === 'EDITOR' || image.userId === userId)) {
    console.log('Auth failed in transform:', { userId, role, imageUserId: image.userId });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const originalBuffer = await readOriginalBuffer(image.r2Key)
  let pipeline = sharp(originalBuffer, { failOn: 'none' })
  const meta = await pipeline.metadata()
  const origW = meta.width || 0
  const origH = meta.height || 0

  if (rotate) pipeline = pipeline.rotate(rotate)
  if (flip) pipeline = pipeline.flip()
  if (flop) pipeline = pipeline.flop()

  // Smart crop to ratio without scaling beyond original
  if (smartCrop) {
    const [rw, rh] = smartCrop.ratio.split(':').map(Number)
    const targetRatio = rw / rh
    let cropW = origW
    let cropH = Math.round(cropW / targetRatio)
    if (cropH > origH) {
      cropH = origH
      cropW = Math.round(cropH * targetRatio)
    }
    const left = Math.max(0, Math.round((origW - cropW) / 2))
    const top = Math.max(0, Math.round((origH - cropH) / 2))
    pipeline = pipeline.extract({ left, top, width: cropW, height: cropH })
  }

  if (crop) {
    const left = Math.max(0, Math.min(origW - 1, Math.round(crop.x)))
    const top = Math.max(0, Math.min(origH - 1, Math.round(crop.y)))
    const width = Math.max(1, Math.min(origW - left, Math.round(crop.width)))
    const height = Math.max(1, Math.min(origH - top, Math.round(crop.height)))
    pipeline = pipeline.extract({ left, top, width, height })
  }

  if (resize && (resize.width || resize.height)) {
    pipeline = pipeline.resize({ width: resize.width, height: resize.height, fit: resize.fit || 'inside' })
  }

  if (enhance) {
    if (enhance.normalize) pipeline = pipeline.normalize()
    if (enhance.sharpen) pipeline = pipeline.sharpen()
    if (typeof enhance.saturation === 'number') pipeline = pipeline.modulate({ saturation: enhance.saturation })
  }

  // If preview mode: render a smaller JPEG and return, without persisting
  if (preview) {
    const maxW = previewMaxWidth || 800
    let p = pipeline
    // Ensure preview isn't too large
    p = p.resize({ width: maxW, withoutEnlargement: true })
    const buf = await p.jpeg({ quality: 80 }).toBuffer()
    const base64 = buf.toString('base64')
    return NextResponse.json({ previewUrl: `data:image/jpeg;base64,${base64}` })
  }

  // Output re-encoded original JPEG (persisted)
  const processed = await pipeline.jpeg({ quality: 90 }).toBuffer({ resolveWithObject: true })

  // Regenerate derivatives
  const thumb = await sharp(processed.data).resize(400).jpeg({ quality: 80 }).toBuffer()
  const widths = [640, 1024, 1600]
  const responsive = await Promise.all(
    widths.map(async (w) => {
      const b = await sharp(processed.data).resize(w).jpeg({ quality: 85 }).toBuffer()
      return { width: w, buffer: b }
    })
  )

  const bucket = process.env.R2_BUCKET
  const hasR2 = !!(bucket && process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY)

  // Derive baseKey from existing key (strip leading slash for local)
  const key = image.r2Key.startsWith('/') ? image.r2Key.slice(1) : image.r2Key
  const baseKey = key.replace(/\/original\.[a-zA-Z0-9]+$/, '')

  if (hasR2) {
    await r2PutObject(bucket!, `${baseKey}/original.jpg`, processed.data, 'image/jpeg')
    await r2PutObject(bucket!, `${baseKey}/thumb.jpg`, thumb, 'image/jpeg')
    for (const r of responsive) {
      await r2PutObject(bucket!, `${baseKey}/w${r.width}.jpg`, r.buffer, 'image/jpeg')
    }
  } else {
    const publicDir = path.join(process.cwd(), 'public')
    const targetDir = path.join(publicDir, baseKey)
    await fs.mkdir(targetDir, { recursive: true })
    await fs.writeFile(path.join(targetDir, 'original.jpg'), processed.data)
    await fs.writeFile(path.join(targetDir, 'thumb.jpg'), thumb)
    for (const r of responsive) {
      await fs.writeFile(path.join(targetDir, `w${r.width}.jpg`), r.buffer)
    }
  }

  // Update DB dimensions and responsive listing
  const metaOut = await sharp(processed.data).metadata()
  const newWidth = metaOut.width || 0
  const newHeight = metaOut.height || 0
  const respJson = widths.map(w => ({ width: w, key: image.r2Key.startsWith('/') ? `/${baseKey}/w${w}.jpg` : `${baseKey}/w${w}.jpg` }))

  await prisma.image.update({
    where: { id: imageId },
    data: {
      width: newWidth,
      height: newHeight,
      sizeBytes: processed.info.size || processed.data.length,
      responsive: respJson as any,
    },
  })

  return NextResponse.json({ ok: true })
}
