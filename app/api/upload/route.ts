import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processImage } from '@/lib/images'
import { r2PutObject } from '@/lib/r2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  }

  const form = await request.formData()
  const file = form.get('file') as File | null
  const albumId = form.get('albumId') as string | null
  const userId = form.get('userId') as string | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const processed = await processImage(buffer)

  const id = crypto.randomUUID()
  const baseKey = `images/${userId ?? 'anon'}/${id}`

    const mime = 'image/jpeg'
  const bucket = process.env.R2_BUCKET
  if (!bucket) return NextResponse.json({ error: 'R2_BUCKET not configured' }, { status: 500 })
  await r2PutObject(bucket, `${baseKey}/original.jpg`, processed.original.buffer, mime)
  await r2PutObject(bucket, `${baseKey}/thumb.jpg`, processed.thumb.buffer, 'image/jpeg')
  for (const res of processed.responsive) {
    await r2PutObject(bucket, `${baseKey}/w${res.width}.jpg`, res.buffer, 'image/jpeg')
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
      r2Key: `${baseKey}/original.jpg`,
      thumbKey: `${baseKey}/thumb.jpg`,
      responsive: processed.responsive.map(r => ({ width: r.width, key: `${baseKey}/w${r.width}.jpg` })),
  exif: (processed.meta.exif as unknown) as any,
    },
  })

  return NextResponse.json({ image })
}
