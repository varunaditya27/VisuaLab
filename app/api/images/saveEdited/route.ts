import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionInfo } from '@/lib/session'
import { r2PutObject } from '@/lib/r2'
import sharp from 'sharp'
import path from 'path'
import { promises as fs } from 'fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { userId, role } = await getSessionInfo()
  if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

  const contentType = req.headers.get('content-type') || ''
  if (!contentType.startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  }

  const form = await req.formData()
  const imageId = form.get('imageId') as string
  const file = form.get('file') as File | null
  if (!imageId || !file) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const image = await prisma.image.findUnique({ where: { id: imageId }, select: { id: true, userId: true, r2Key: true } })
  if (!image) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!(role === 'ADMIN' || role === 'EDITOR' || image.userId === userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const processed = await sharp(buffer).jpeg({ quality: 90 }).toBuffer({ resolveWithObject: true })
  const thumbJpeg = await sharp(processed.data).resize(400).jpeg({ quality: 80 }).toBuffer()
  const thumbWebp = await sharp(processed.data).resize(400).webp({ quality: 80 }).toBuffer()
  const thumbAvif = await sharp(processed.data).resize(400).avif({ quality: 60 }).toBuffer()
  const widths = [640, 1024, 1600]
  const responsive = await Promise.all(
    widths.map(async (w) => {
      const base = sharp(processed.data).resize(w)
      const jpeg = await base.clone().jpeg({ quality: 85 }).toBuffer()
      const webp = await base.clone().webp({ quality: 80 }).toBuffer()
      const avif = await base.clone().avif({ quality: 60 }).toBuffer()
      return { width: w, jpeg, webp, avif }
    })
  )

  const bucket = process.env.R2_BUCKET
  const hasR2 = !!(bucket && process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY)
  const key = image.r2Key.startsWith('/') ? image.r2Key.slice(1) : image.r2Key
  const baseKey = key.replace(/\/original\.[a-zA-Z0-9]+$/, '')

  if (hasR2) {
    await r2PutObject(bucket!, `${baseKey}/original.jpg`, processed.data, 'image/jpeg')
    await r2PutObject(bucket!, `${baseKey}/thumb.jpg`, thumbJpeg, 'image/jpeg')
    await r2PutObject(bucket!, `${baseKey}/thumb.webp`, thumbWebp, 'image/webp')
    await r2PutObject(bucket!, `${baseKey}/thumb.avif`, thumbAvif, 'image/avif')
    for (const r of responsive) {
      await r2PutObject(bucket!, `${baseKey}/w${r.width}.jpg`, r.jpeg, 'image/jpeg')
      await r2PutObject(bucket!, `${baseKey}/w${r.width}.webp`, r.webp, 'image/webp')
      await r2PutObject(bucket!, `${baseKey}/w${r.width}.avif`, r.avif, 'image/avif')
    }
  } else {
    const publicDir = path.join(process.cwd(), 'public')
    const targetDir = path.join(publicDir, baseKey)
    await fs.mkdir(targetDir, { recursive: true })
    await fs.writeFile(path.join(targetDir, 'original.jpg'), processed.data)
    await fs.writeFile(path.join(targetDir, 'thumb.jpg'), thumbJpeg)
    await fs.writeFile(path.join(targetDir, 'thumb.webp'), thumbWebp)
    await fs.writeFile(path.join(targetDir, 'thumb.avif'), thumbAvif)
    for (const r of responsive) {
      await fs.writeFile(path.join(targetDir, `w${r.width}.jpg`), r.jpeg)
      await fs.writeFile(path.join(targetDir, `w${r.width}.webp`), r.webp)
      await fs.writeFile(path.join(targetDir, `w${r.width}.avif`), r.avif)
    }
  }

  const metaOut = await sharp(processed.data).metadata()
  const newWidth = metaOut.width || 0
  const newHeight = metaOut.height || 0
  const respJson = widths.map(w => ({ width: w, key: image.r2Key.startsWith('/') ? `/${baseKey}/w${w}.jpg` : `${baseKey}/w${w}.jpg` }))

  await prisma.image.update({
    where: { id: imageId },
    data: { width: newWidth, height: newHeight, sizeBytes: processed.info.size || processed.data.length, responsive: respJson as any },
  })

  return NextResponse.json({ ok: true })
}
