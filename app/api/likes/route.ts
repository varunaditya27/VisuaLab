import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSessionInfo } from '../../../lib/session'

// GET /api/likes?imageId=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const imageId = searchParams.get('imageId')
  if (!imageId) return NextResponse.json({ error: 'imageId required' }, { status: 400 })

  const db = prisma as any
  const [count, likers] = await Promise.all([
    db.like.count({ where: { imageId } }),
    db.like.findMany({ where: { imageId }, select: { userId: true } })
  ])

  const { userId } = await getSessionInfo()
  const likedByMe = !!(userId && likers.some((l: { userId: string }) => l.userId === userId))
  return NextResponse.json({ count, likedByMe })
}

const LikeSchema = z.object({ imageId: z.string().min(1) })

// POST /api/likes -> toggle like for current user
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parse = LikeSchema.safeParse(body)
  if (!parse.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const { imageId } = parse.data

  const { userId } = await getSessionInfo()
  if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

  const db = prisma as any
  const existing = await db.like.findUnique({ where: { userId_imageId: { userId, imageId } } })
  if (existing) {
    await db.like.delete({ where: { userId_imageId: { userId, imageId } } })
  } else {
    await db.like.create({ data: { userId, imageId } })
  }
  const count = await db.like.count({ where: { imageId } })
  return NextResponse.json({ count, likedByMe: !existing })
}
