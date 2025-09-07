import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET() {
  const albums = await prisma.album.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { images: true } } },
  })
  return NextResponse.json({ albums })
}

const CreateAlbum = z.object({ name: z.string().min(1), description: z.string().optional(), ownerId: z.string() })

export async function POST(request: Request) {
  const data = await request.json().catch(() => null)
  const parsed = CreateAlbum.safeParse(data)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 })

  const { name, description, ownerId } = parsed.data
  const album = await prisma.album.create({ data: { name, description, ownerId } })
  return NextResponse.json({ album }, { status: 201 })
}
