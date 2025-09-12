import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { images: true } } },
  })
  const out = tags.map(t => ({ id: t.id, name: t.name, count: (t as any)._count?.images ?? 0 }))
  return NextResponse.json({ tags: out })
}

const CreateSchema = z.object({ name: z.string().min(1) })
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const tag = await prisma.tag.upsert({ where: { name: parsed.data.name }, update: {}, create: { name: parsed.data.name } })
  return NextResponse.json({ tag })
}
