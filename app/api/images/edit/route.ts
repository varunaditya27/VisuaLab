import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSessionInfo } from '@/lib/session'

const EditSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  caption: z.string().optional(),
  altText: z.string().optional(),
  license: z.string().optional(),
  attribution: z.string().optional(),
  privacy: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).optional(),
  albumId: z.string().nullable().optional(),
})

export async function POST(req: Request) {
  const { userId, role } = await getSessionInfo()
  if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const parsed = EditSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const { id, ...data } = parsed.data
  const img = await prisma.image.findUnique({ where: { id }, select: { userId: true } })
  if (!img) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!(role === 'ADMIN' || img.userId === userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const updated = await prisma.image.update({ where: { id }, data })
  return NextResponse.json({ image: updated })
}
