import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getVectorProvider } from '@/lib/vector/provider'
import { weaviateQuery } from '@/lib/vector/weaviate'
import { getSessionInfo } from '@/lib/session'
import { r2GetSignedUrl, r2PublicUrl } from '@/lib/r2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    const provider = getVectorProvider()
    let body: any = null
    let file: File | null = null
    if (contentType.includes('application/json')) {
      body = await req.json().catch(() => ({}))
    } else if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      body = Object.fromEntries(Array.from(form.entries()).filter(([k]) => k !== 'file'))
      if (typeof body.filters === 'string') {
        try { body.filters = JSON.parse(body.filters) } catch {}
      }
      file = form.get('file') as File | null
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 })
    }

    const text = (body?.text as string | undefined) || undefined
    const imageUrl = (body?.imageUrl as string | undefined) || undefined
    const topK = Math.max(1, Math.min(100, parseInt(body?.topK ?? '20')))

    if (!text && !imageUrl && !file) {
      return NextResponse.json({ error: 'Provide text, imageUrl, or file' }, { status: 400 })
    }
    if (typeof text === 'string' && text.trim().length === 0) {
      return NextResponse.json({ error: 'Query text is empty' }, { status: 400 })
    }

    // Build query embedding
    let embedding: number[]
    if (text) {
      embedding = await provider.embedText(text)
    } else if (imageUrl) {
      embedding = await provider.embedImageFromUrl(imageUrl)
    } else {
      const buf = Buffer.from(await file!.arrayBuffer())
      embedding = await provider.embedImageFromBuffer(buf)
    }

    // Optional filters + privacy enforcement
    const { userId, role } = await getSessionInfo()
    const isAdmin = role === 'ADMIN'
    let where: any = { }
    const albumId = body?.filters?.albumId as string | undefined
    if (albumId) {
      where = {
        operator: 'And',
        operands: [
          { path: ['albumId'], operator: 'Equal', valueText: albumId },
        ]
      }
    }
    if (!isAdmin) {
      const privacyOr = userId ? [
        { path: ['privacy'], operator: 'Equal', valueText: 'PUBLIC' },
        { path: ['userId'], operator: 'Equal', valueText: userId },
      ] : [
        { path: ['privacy'], operator: 'Equal', valueText: 'PUBLIC' },
      ]
      if (where?.operator === 'And') {
        where.operands.push({ operator: 'Or', operands: privacyOr })
      } else if (where) {
        where = { operator: 'And', operands: [ where, { operator: 'Or', operands: privacyOr } ] }
      } else {
        where = { operator: 'Or', operands: privacyOr }
      }
    }

    const results = await weaviateQuery(embedding, topK, where)
    const ids = results.map(r => r.imageId)
    const images = await prisma.image.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true, thumbKey: true }
    })
    const imgMap = new Map(images.map(i => [i.id, i]))
    const bucket = process.env.R2_BUCKET
    const payload = await Promise.all(results.map(async (r) => {
      const img = imgMap.get(r.imageId)
      let thumbUrl: string | null = null
      if (img?.thumbKey && bucket) {
        try { thumbUrl = await r2GetSignedUrl(bucket, img.thumbKey) } catch {}
      }
      if (!thumbUrl && img?.thumbKey) thumbUrl = r2PublicUrl(img.thumbKey)
      return {
        imageId: r.imageId,
        score: r.score,
        title: img?.title || null,
        thumbUrl,
      }
    }))
    return NextResponse.json({ results: payload })
  } catch (e: any) {
    const msg = e?.message || 'Vector search failed'
    return NextResponse.json({ error: msg, results: [] }, { status: 500 })
  }
}
