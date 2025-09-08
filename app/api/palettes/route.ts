import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSessionInfo } from '@/lib/session'

export async function GET() {
  const db = prisma as any
  const items = await db.palette.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ palettes: items })
}

const SaveSchema = z.object({ id: z.string().optional(), name: z.string().min(1), json: z.any() })

export async function POST(req: Request) {
  const { userId } = await getSessionInfo()
  if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const parsed = SaveSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const { id, name, json } = parsed.data
  const data = { name, json, ownerId: userId }
  const db = prisma as any
  const saved = id
    ? await db.palette.update({ where: { id }, data })
    : await db.palette.create({ data })
  return NextResponse.json({ palette: saved })
}
