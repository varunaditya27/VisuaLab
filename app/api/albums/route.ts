import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSessionInfo } from '@/lib/session'

export async function GET() {
  const albums = await prisma.album.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { images: true } } },
  })
  return NextResponse.json({ albums })
}

const CreateAlbum = z.object({ name: z.string().min(1), description: z.string().optional() })

export async function POST(request: Request) {
  const data = await request.json().catch(() => null)
  const parsed = CreateAlbum.safeParse(data)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 })

  const { name, description } = parsed.data
  const { userId } = await getSessionInfo()
  if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

  const album = await prisma.album.create({ data: { name, description, ownerId: userId } })
  return NextResponse.json({ album }, { status: 201 })
}
