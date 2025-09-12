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

  // Best-effort client address for deduplication (works locally and behind proxies)
  const xfwd = req.headers.get('x-forwarded-for') || ''
  const ip = (xfwd.split(',')[0] || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || '').trim() || undefined

  const db = prisma as any

  // Deduplicate very recent duplicate opens (e.g., React StrictMode, double effects)
  const windowMs = 15_000 // 15 seconds
  const since = new Date(Date.now() - windowMs)

  try {
    const orTerms = [
      ...(userId ? [{ userId }] as any[] : []),
      ...(ip ? [{ ip }] as any[] : []),
    ]
    const where: any = {
      imageId: image.id,
      createdAt: { gte: since },
    }
    if (orTerms.length > 0) where.OR = orTerms

    const existing = await db.imageView.findFirst({ where, select: { id: true } })

    if (!existing) {
      await db.imageView.create({ data: { imageId: image.id, userId: userId ?? undefined, ip } })
    }
  } catch {
    // Non-fatal: if dedupe fails (e.g., invalid filter), still ensure we create a record
    try { await (db as any).imageView.create({ data: { imageId: image.id, userId: userId ?? undefined, ip } }) } catch {}
  }

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
