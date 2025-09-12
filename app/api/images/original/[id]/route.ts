import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionInfo } from '@/lib/session'
import { r2GetObjectBuffer } from '@/lib/r2'
import path from 'path'
import { promises as fs } from 'fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: any) {
  try {
    const imageId = params.id
    if (!imageId) return NextResponse.json({ error: 'imageId required' }, { status: 400 })

    const { userId, role } = await getSessionInfo()
    const isAdmin = role === 'ADMIN'

    const img = await prisma.image.findUnique({
      where: { id: imageId },
      select: { id: true, r2Key: true, userId: true, mime: true },
    })
    if (!img) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!(isAdmin || (!!userId && img.userId === userId))) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const bucket = process.env.R2_BUCKET
    const hasR2 = !!(bucket && process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY)

    let buffer: Buffer | null = null
    let contentType = img.mime || 'image/jpeg'

    if (img.r2Key?.startsWith('/')) {
      const rel = img.r2Key.replace(/^\//, '')
      const filePath = path.join(process.cwd(), 'public', rel)
      buffer = await fs.readFile(filePath)
    } else if (hasR2 && img.r2Key) {
      buffer = await r2GetObjectBuffer(bucket!, img.r2Key)
    } else if (img.r2Key?.startsWith('http')) {
      const res = await fetch(img.r2Key)
      if (!res.ok) return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 })
      const arr = await res.arrayBuffer()
      buffer = Buffer.from(arr)
      contentType = res.headers.get('content-type') || contentType
    } else {
      return NextResponse.json({ error: 'Source unavailable' }, { status: 500 })
    }

    const view = new Uint8Array(buffer)
    return new Response(view, { status: 200, headers: { 'Content-Type': contentType, 'Cache-Control': 'private, max-age=60' } })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
