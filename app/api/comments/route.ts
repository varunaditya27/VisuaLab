import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSessionInfo } from '../../../lib/session'
import crypto from 'crypto'

// GET /api/comments?imageId=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const imageId = searchParams.get('imageId')
  if (!imageId) return NextResponse.json({ error: 'imageId required' }, { status: 400 })

  const db = prisma as any
  const comments = await db.comment.findMany({
    where: { imageId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, content: true, createdAt: true,
      user: { select: { id: true, username: true } }
    }
  })
  return NextResponse.json({ comments })
}

const CreateSchema = z.object({ 
  imageId: z.string().min(1), 
  content: z.string().min(1).max(500), 
  a: z.number().int().min(0).max(999),
  b: z.number().int().min(0).max(999),
  issued: z.number().int(),
  sig: z.string().min(8),
  answer: z.number().int().min(0).max(1999)
})

// POST /api/comments
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const { imageId, content, a, b, issued, sig, answer } = parsed.data

  const secret = process.env.MAPTCHA_SECRET || 'dev-secret'
  const base = `${a}|${b}|${issued}`
  const expect = crypto.createHmac('sha256', secret).update(base).digest('hex')
  if (expect !== sig) return NextResponse.json({ error: 'Invalid challenge' }, { status: 429 })
  if (Date.now() - issued > 2 * 60 * 1000) return NextResponse.json({ error: 'Challenge expired' }, { status: 429 })
  if (a + b !== answer) return NextResponse.json({ error: 'Wrong answer' }, { status: 429 })

  const { userId } = await getSessionInfo()
  if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

  const db = prisma as any
  const c = await db.comment.create({ data: { imageId, userId, content } })
  return NextResponse.json({ commentId: c.id }, { status: 201 })
}
