import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { r2PublicUrl, r2GetSignedUrl } from '@/lib/r2'
import { getSessionInfo } from '@/lib/session'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
  const album = searchParams.get('album') || searchParams.get('albumId')
    const q = searchParams.get('q') || undefined
    const tags = (searchParams.get('tags') || '').split(',').map(s => s.trim()).filter(Boolean)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const license = searchParams.get('license') || undefined
    const imageId = searchParams.get('imageId') || undefined
  const sort = (searchParams.get('sort') || 'new') as 'new' | 'liked' | 'views'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '100', 10)))

    const { userId, role } = await getSessionInfo()
    const isAdmin = role === 'ADMIN'

    // Single image fetch (allows UNLISTED if id specified)
    if (imageId) {
      const db = prisma as any
      const img = await db.image.findUnique({
        where: { id: imageId },
        select: { id: true, title: true, thumbKey: true, privacy: true, userId: true, r2Key: true, responsive: true }
      })
      if (!img) return NextResponse.json({ images: [] })
      const canView = isAdmin || img.privacy === 'PUBLIC' || (img.privacy === 'UNLISTED') || (img.userId && img.userId === userId)
      if (!canView) return NextResponse.json({ images: [] })
      const bucket = process.env.R2_BUCKET
      let thumbJpg: string | null = null
      let thumbWebp: string | null = null
      let thumbAvif: string | null = null
      let originalUrl: string | null = null
      if (img.thumbKey) {
        const jpgKey = img.thumbKey
        const webpKey = jpgKey.replace(/\.jpe?g$/i, '.webp')
        const avifKey = jpgKey.replace(/\.jpe?g$/i, '.avif')
        if (bucket) { try { thumbJpg = await r2GetSignedUrl(bucket, jpgKey) } catch {} }
        if (!thumbJpg) thumbJpg = r2PublicUrl(jpgKey)
        if (bucket) { try { thumbWebp = await r2GetSignedUrl(bucket, webpKey) } catch {} }
        if (!thumbWebp) thumbWebp = r2PublicUrl(webpKey)
        if (bucket) { try { thumbAvif = await r2GetSignedUrl(bucket, avifKey) } catch {} }
        if (!thumbAvif) thumbAvif = r2PublicUrl(avifKey)
      }
      if (img.r2Key) {
        if (bucket) { try { originalUrl = await r2GetSignedUrl(bucket, img.r2Key) } catch {} }
        if (!originalUrl) originalUrl = r2PublicUrl(img.r2Key)
      }

      // Build responsive URLs for all formats
      const resp: Array<{ width: number; jpg: string | null; webp: string | null; avif: string | null }> = []
      const responsive = (img.responsive as Array<{ width: number; key: string }>) || []
      for (const r of responsive) {
        const jpgKey = r.key
        const webpKey = jpgKey.replace(/\.jpe?g$/i, '.webp')
        const avifKey = jpgKey.replace(/\.jpe?g$/i, '.avif')
        let jpg: string | null = null
        let webp: string | null = null
        let avif: string | null = null
        if (bucket) { try { jpg = await r2GetSignedUrl(bucket, jpgKey) } catch {} }
        if (!jpg) jpg = r2PublicUrl(jpgKey)
        if (bucket) { try { webp = await r2GetSignedUrl(bucket, webpKey) } catch {} }
        if (!webp) webp = r2PublicUrl(webpKey)
        if (bucket) { try { avif = await r2GetSignedUrl(bucket, avifKey) } catch {} }
        if (!avif) avif = r2PublicUrl(avifKey)
        resp.push({ width: r.width, jpg, webp, avif })
      }

      return NextResponse.json({ images: [{ id: img.id, title: img.title, thumbUrl: thumbJpg, originalUrl, thumb: { jpg: thumbJpg, webp: thumbWebp, avif: thumbAvif }, responsive: resp }] })
    }

    // Build where filter for list
    let where: any = {}
    if (album) {
      if (album === 'none') {
        where.albumId = null
      } else {
        where.albumId = album
      }
    }

    // Privacy enforcement for listings: PUBLIC only, plus own images if logged in, admins see all
    if (!isAdmin) {
      if (userId) {
        where.OR = [
          { privacy: 'PUBLIC' },
          { userId }
        ]
      } else {
        where.privacy = 'PUBLIC'
      }
    }

    if (q) {
      where.OR = [
        ...(where.OR || []),
        { title: { contains: q, mode: 'insensitive' } },
        { caption: { contains: q, mode: 'insensitive' } },
        { tags: { some: { tag: { name: { contains: q, mode: 'insensitive' } } } } }
      ]
    }
    if (tags.length) {
      // all tags required
      where.AND = [ ...(where.AND || []), ...tags.map(name => ({ tags: { some: { tag: { name } } } })) ]
    }
    if (from) {
      const dt = new Date(from)
      if (!isNaN(dt.getTime())) {
        where.createdAt = { ...(where.createdAt || {}), gte: dt }
      }
    }
    if (to) {
      const dt = new Date(to)
      if (!isNaN(dt.getTime())) {
        where.createdAt = { ...(where.createdAt || {}), lte: dt }
      }
    }
    if (license) {
      where.license = { contains: license, mode: 'insensitive' }
    }

    // Determine ordering
    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'liked') orderBy = { likes: { _count: 'desc' } }
    if (sort === 'views') orderBy = { views: { _count: 'desc' } }

    const rows = await prisma.image.findMany({
      where,
      select: { id: true, title: true, thumbKey: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize + 1, // fetch one extra to know if more data exists
    })
    const bucket = process.env.R2_BUCKET
    const limited = rows.slice(0, pageSize)
    const images = await Promise.all(
      limited.map(async (r) => {
        let thumbJpg: string | null = null
        let thumbWebp: string | null = null
        let thumbAvif: string | null = null
        if (r.thumbKey) {
          const jpgKey = r.thumbKey
          const webpKey = jpgKey.replace(/\.jpe?g$/i, '.webp')
          const avifKey = jpgKey.replace(/\.jpe?g$/i, '.avif')
          if (bucket) { try { thumbJpg = await r2GetSignedUrl(bucket, jpgKey) } catch {} }
          if (!thumbJpg) thumbJpg = r2PublicUrl(jpgKey)
          if (bucket) { try { thumbWebp = await r2GetSignedUrl(bucket, webpKey) } catch {} }
          if (!thumbWebp) thumbWebp = r2PublicUrl(webpKey)
          if (bucket) { try { thumbAvif = await r2GetSignedUrl(bucket, avifKey) } catch {} }
          if (!thumbAvif) thumbAvif = r2PublicUrl(avifKey)
        }
        return { id: r.id, title: r.title, thumbUrl: thumbJpg, thumb: { jpg: thumbJpg, webp: thumbWebp, avif: thumbAvif } }
      })
    )
    const hasMore = rows.length > pageSize
    return NextResponse.json({ images, hasMore })
  } catch (err: any) {
    return NextResponse.json({ images: [], error: err?.message ?? 'Unknown error' }, { status: 200 })
  }
}
