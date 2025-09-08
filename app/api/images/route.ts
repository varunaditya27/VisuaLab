import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { r2PublicUrl, r2GetSignedUrl } from '@/lib/r2'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const album = searchParams.get('album') || searchParams.get('albumId')
    const rows = await prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
      where: album ? { albumId: album } : undefined,
      select: { id: true, title: true, thumbKey: true },
      take: 100,
    })
    const bucket = process.env.R2_BUCKET
    const images = await Promise.all(
      rows.map(async (r) => {
        let thumbUrl: string | null = null
        if (r.thumbKey && bucket) {
          try {
            thumbUrl = await r2GetSignedUrl(bucket, r.thumbKey)
          } catch {}
        }
        // Fallback to public URL if signing failed and a base is provided
        if (!thumbUrl && r.thumbKey) thumbUrl = r2PublicUrl(r.thumbKey)
        return { ...r, thumbUrl }
      })
    )
    return NextResponse.json({ images })
  } catch (err: any) {
    return NextResponse.json({ images: [], error: err?.message ?? 'Unknown error' }, { status: 200 })
  }
}
