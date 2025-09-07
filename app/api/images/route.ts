import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const images = await prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
      include: { tags: { include: { tag: true } }, album: true },
      take: 100,
    })
    return NextResponse.json({ images })
  } catch (err: any) {
    return NextResponse.json({ images: [], error: err?.message ?? 'Unknown error' }, { status: 200 })
  }
}
