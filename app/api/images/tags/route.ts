import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSessionInfo } from '@/lib/session'

const AssignSchema = z.object({ imageId: z.string().min(1), tagNames: z.array(z.string().min(1)).default([]) })

export async function POST(req: Request) {
  const { userId, role } = await getSessionInfo()
  if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const parsed = AssignSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const { imageId, tagNames } = parsed.data
  const image = await prisma.image.findUnique({ where: { id: imageId }, select: { userId: true } })
  if (!image) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!(role === 'ADMIN' || image.userId === userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tags = await Promise.all(tagNames.map(name => prisma.tag.upsert({ where: { name }, update: {}, create: { name } })))
  await prisma.imageTag.deleteMany({ where: { imageId } })
  await prisma.imageTag.createMany({ data: tags.map(t => ({ imageId, tagId: t.id })) })
  return NextResponse.json({ ok: true })
}
