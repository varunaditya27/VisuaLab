import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processImage } from '@/lib/images'
import { r2PutObject } from '@/lib/r2'
import { promises as fs } from 'fs'
import path from 'path'
import { getSessionInfo } from '@/lib/session'
import { getVectorProvider } from '@/lib/vector/provider'
import { weaviateUpsertImage } from '@/lib/vector/weaviate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  }

  const form = await request.formData()
  const file = form.get('file') as File | null
  const albumId = (form.get('albumId') as string | null) || null
  const title = (form.get('title') as string | null) || null
  const caption = (form.get('caption') as string | null) || null
  const tagsCSV = (form.get('tags') as string | null) || null
  // Derive user from session; ignore client-supplied userId for safety
  const { userId: sessionUserId } = await getSessionInfo()
  const userId = sessionUserId
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const processed = await processImage(buffer)

  const id = crypto.randomUUID()
  const baseKey = `images/${userId ?? 'anon'}/${id}`

  const mime = 'image/jpeg'
  const bucket = process.env.R2_BUCKET
  const hasR2 = !!(bucket && process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY)

  if (hasR2) {
    await r2PutObject(bucket!, `${baseKey}/original.jpg`, processed.original.buffer, mime)
    await r2PutObject(bucket!, `${baseKey}/thumb.jpg`, processed.thumb.buffer, 'image/jpeg')
    for (const res of processed.responsive) {
      await r2PutObject(bucket!, `${baseKey}/w${res.width}.jpg`, res.buffer, 'image/jpeg')
    }
  } else {
    // Local fallback: write into public/ so assets are served at /images/...
    const publicDir = path.join(process.cwd(), 'public')
    const targetDir = path.join(publicDir, baseKey)
    await fs.mkdir(targetDir, { recursive: true })
    await fs.writeFile(path.join(targetDir, 'original.jpg'), processed.original.buffer)
    await fs.writeFile(path.join(targetDir, 'thumb.jpg'), processed.thumb.buffer)
    for (const res of processed.responsive) {
      await fs.writeFile(path.join(targetDir, `w${res.width}.jpg`), res.buffer)
    }
  }

  const image = await prisma.image.create({
    data: {
      id,
  userId: userId ?? null,
  albumId: albumId ?? null,
      mime,
      width: processed.meta.width,
      height: processed.meta.height,
      sizeBytes: processed.original.info.size ?? buffer.byteLength,
  // For local fallback, prefix with '/' so r2PublicUrl returns web path
  r2Key: hasR2 ? `${baseKey}/original.jpg` : `/${baseKey}/original.jpg`,
  thumbKey: hasR2 ? `${baseKey}/thumb.jpg` : `/${baseKey}/thumb.jpg`,
  responsive: processed.responsive.map(r => ({ width: r.width, key: hasR2 ? `${baseKey}/w${r.width}.jpg` : `/${baseKey}/w${r.width}.jpg` })),
  exif: (processed.meta.exif as unknown) as any,
      title: title || undefined,
      caption: caption || undefined,
    },
  })

  // Handle tags if provided
  if (tagsCSV) {
    const names = tagsCSV.split(',').map(s => s.trim()).filter(Boolean)
    if (names.length) {
      const tags = await Promise.all(names.map(name => prisma.tag.upsert({ where: { name }, update: {}, create: { name } })))
      await prisma.imageTag.createMany({ data: tags.map(t => ({ imageId: image.id, tagId: t.id })) })
    }
  }

  // Background embed + index
  ;(async () => {
    try {
      const provider = getVectorProvider()
      const originalKey = hasR2 ? `${baseKey}/original.jpg` : `/${baseKey}/original.jpg`
      const publicUrl = hasR2 ? (process.env.R2_PUBLIC_BASE_URL ? `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${process.env.R2_BUCKET}/${originalKey}` : null) : `${process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '')}${originalKey}`
      const emb = publicUrl ? await provider.embedImageFromUrl(publicUrl) : await provider.embedImageFromBuffer(processed.original.buffer)
      await weaviateUpsertImage(image.id, emb, {
        createdAt: new Date().toISOString(),
        albumId: image.albumId ?? null,
        privacy: (image as any).privacy ?? 'PUBLIC',
        userId: image.userId ?? null,
      })
    } catch (e) {
      console.error('Vector index error', e)
    }
  })()

  return NextResponse.json({ image })
}
