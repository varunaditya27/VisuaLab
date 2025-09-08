import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSessionInfo } from '@/lib/session'

const ViewSchema = z.object({ imageId: z.string().min(1) })

export async function POST(req: Request) {
  const { userId } = await getSessionInfo()
  const body = await req.json().catch(() => null)
  const parsed = ViewSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const image = await prisma.image.findUnique({ where: { id: parsed.data.imageId }, select: { id: true } })
  if (!image) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    const db = prisma as any
    await db.imageView.create({ data: { imageId: image.id, userId: userId ?? undefined } })
  } catch {}
  const db = prisma as any
  const count = await db.imageView.count({ where: { imageId: image.id } })
  return NextResponse.json({ views: count })
}

// GET /api/views?imageId=... -> returns count without incrementing
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const imageId = searchParams.get('imageId')
  if (!imageId) return NextResponse.json({ error: 'imageId required' }, { status: 400 })
  const db = prisma as any
  const count = await db.imageView.count({ where: { imageId } })
  return NextResponse.json({ views: count })
}
