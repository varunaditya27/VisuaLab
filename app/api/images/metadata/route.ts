import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionInfo } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Update image metadata (title, caption, tags, alt, license, attribution, privacy, albumId)
export async function PATCH(req: Request) {
  try {
    const { userId, role } = await getSessionInfo()
    if (!userId && role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { imageId, title, caption, alt, license, attribution, privacy, albumId, tags } = body || {}
    if (!imageId) return NextResponse.json({ error: 'imageId required' }, { status: 400 })

    // Ensure ownership or admin
    const img = await prisma.image.findUnique({ where: { id: imageId }, select: { userId: true } })
    if (!img) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const isAdmin = role === 'ADMIN'
    if (!isAdmin && img.userId && img.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Normalizers
    const toNullIfEmpty = (v: unknown) => typeof v === 'string' ? (v.trim() === '' ? null : v) : (v === null ? null : undefined)
    const albumIdNorm = typeof albumId === 'string' ? (albumId.trim() === '' ? null : albumId) : (albumId === null ? null : undefined)
    const privacyAllowed = ['PUBLIC','UNLISTED','PRIVATE'] as const
    const privacyNorm = typeof privacy === 'string' && privacyAllowed.includes(privacy as any) ? privacy : undefined

    if (albumIdNorm) {
      const exists = await prisma.album.findUnique({ where: { id: albumIdNorm } })
      if (!exists) return NextResponse.json({ error: 'Invalid albumId' }, { status: 400 })
    }

    const updated = await prisma.image.update({
      where: { id: imageId },
      data: {
        title: toNullIfEmpty(title) as any,
        caption: toNullIfEmpty(caption) as any,
        altText: toNullIfEmpty(alt) as any,
        license: toNullIfEmpty(license) as any,
        attribution: toNullIfEmpty(attribution) as any,
        privacy: privacyNorm as any,
        albumId: (albumIdNorm as any),
      }
    })

    // Tags optional
    if (typeof tags === 'string') {
      const parts = tags.split(',').map((s: string) => s.trim()).filter(Boolean)
      await prisma.imageTag.deleteMany({ where: { imageId } })
      if (parts.length) {
        const tagRows = await Promise.all(parts.map((name: string) => prisma.tag.upsert({ where: { name }, update: {}, create: { name } })))
        await prisma.imageTag.createMany({ data: tagRows.map(t => ({ imageId, tagId: t.id })) })
      }
    }

    return NextResponse.json({ image: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
