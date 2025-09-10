import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionInfo } from '@/lib/session'
import { getProvider, basicNsfwFilter } from '@/lib/ai/provider'
import { processImage } from '@/lib/images'
import { r2PutObject } from '@/lib/r2'
import path from 'path'
import { promises as fs } from 'fs'
import { getVectorProvider } from '@/lib/vector/provider'
import { weaviateUpsertImage } from '@/lib/vector/weaviate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const controllerMap = new Map<string, AbortController>()

export async function POST(req: Request) {
  const { userId } = await getSessionInfo()
  if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body?.prompt || typeof body.prompt !== 'string') {
    return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
  }
  const {
    prompt,
    albumId,
    seed,
    steps,
    width,
    height,
    batch,
    negativePrompt,
    provider,
    consentNSFW,
  } = body

  const db = prisma as any
  const job = await db.generationJob.create({
    data: {
      userId,
      albumId: albumId ?? null,
      prompt,
      seed: seed ?? null,
      steps: steps ?? undefined,
      width: width ?? undefined,
      height: height ?? undefined,
      batch: Math.max(1, Math.min(4, batch ?? 1)),
      provider: (provider || process.env.AI_PROVIDER || 'replicate'),
      status: 'queued',
      logs: [],
    },
  })

  // Fire and forget execution
  ;(async () => {
    const ctrl = new AbortController()
    controllerMap.set(job.id, ctrl)
    const signal = ctrl.signal
    const logs: string[] = []
    const onLog = (m: string) => {
      logs.push(`[${new Date().toISOString()}] ${m}`)
    }
    try {
  await db.generationJob.update({ where: { id: job.id }, data: { status: 'running', logs } })
      const providerImpl = getProvider(provider)
      const result = await providerImpl.generate({ prompt, seed, steps, width, height, batch, negativePrompt }, onLog, signal)
      const savedImageIds: string[] = []
      const safetyTagsAll: string[] = []
      // Save each image using existing image pipeline
      for (const [idx, img] of result.images.entries()) {
        if (!consentNSFW && !basicNsfwFilter(img.safetyTags)) {
          onLog(`Image ${idx} flagged by NSFW filter; skipping`)
          continue
        }
        const processed = await processImage(img.buffer)
        const id = crypto.randomUUID()
        const baseKey = `images/${userId}/${id}`
        const mime = 'image/jpeg'
        const bucket = process.env.R2_BUCKET
        const hasR2 = !!(bucket && process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY)
        if (hasR2) {
          await r2PutObject(bucket!, `${baseKey}/original.jpg`, processed.original.buffer, mime)
          await r2PutObject(bucket!, `${baseKey}/thumb.jpg`, processed.thumb.buffer, 'image/jpeg')
          for (const res of processed.responsive) {
            await r2PutObject(bucket!, `${baseKey}/w${res.width}.jpg`, res.buffer, 'image/jpeg')
          }
        } else {
          const publicDir = path.join(process.cwd(), 'public')
          const targetDir = path.join(publicDir, baseKey)
          await fs.mkdir(targetDir, { recursive: true })
          await fs.writeFile(path.join(targetDir, 'original.jpg'), processed.original.buffer)
          await fs.writeFile(path.join(targetDir, 'thumb.jpg'), processed.thumb.buffer)
          for (const res of processed.responsive) {
            await fs.writeFile(path.join(targetDir, `w${res.width}.jpg`), res.buffer)
          }
        }
        const imgRow = await db.image.create({
          data: {
            id,
            userId,
            albumId: albumId ?? null,
            mime,
            width: processed.meta.width,
            height: processed.meta.height,
            sizeBytes: processed.original.info.size ?? img.buffer.byteLength,
            r2Key: hasR2 ? `${baseKey}/original.jpg` : `/${baseKey}/original.jpg`,
            thumbKey: hasR2 ? `${baseKey}/thumb.jpg` : `/${baseKey}/thumb.jpg`,
            responsive: processed.responsive.map(r => ({ width: r.width, key: hasR2 ? `${baseKey}/w${r.width}.jpg` : `/${baseKey}/w${r.width}.jpg` })),
            exif: processed.meta.exif as any,
            generationMeta: {
              prompt,
              seed,
              steps: steps ?? undefined,
              width: width ?? undefined,
              height: height ?? undefined,
              batch,
              provider: providerImpl.name,
              model: result.model,
              safetyTags: img.safetyTags || [],
              createdAt: new Date().toISOString(),
            },
          },
        })
        savedImageIds.push(imgRow.id)
        if (img.safetyTags) safetyTagsAll.push(...img.safetyTags)
        // Fire-and-forget embedding + index in Weaviate
        ;(async () => {
          try {
            const provider = getVectorProvider()
            // Prefer a public/origin URL for embedding call; if using R2 public, build URL
            const originalKey = hasR2 ? `${baseKey}/original.jpg` : `/${baseKey}/original.jpg`
            const publicUrl = hasR2 ? (process.env.R2_PUBLIC_BASE_URL ? `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${process.env.R2_BUCKET}/${originalKey}` : null) : `${process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '')}${originalKey}`
            const emb = publicUrl ? await provider.embedImageFromUrl(publicUrl) : await provider.embedImageFromBuffer(processed.original.buffer)
            await weaviateUpsertImage(imgRow.id, emb, {
              createdAt: new Date().toISOString(),
              albumId: imgRow.albumId ?? null,
              privacy: (imgRow as any).privacy ?? 'PUBLIC',
              userId: imgRow.userId ?? null,
            })
          } catch (e) {
            console.error('Vector index error', e)
          }
        })()
      }
      await db.generationJob.update({
        where: { id: job.id },
        data: { status: 'completed', logs, resultImageIds: savedImageIds, safetyTags: safetyTagsAll },
      })
    } catch (e: any) {
      const msg = e?.message || 'Generation failed'
      logs.push(`[${new Date().toISOString()}] ERROR: ${msg}`)
      const status = e?.name === 'AbortError' ? 'aborted' : 'failed'
      await db.generationJob.update({ where: { id: job.id }, data: { status: status as any, logs, abortedAt: status === 'aborted' ? new Date() : null } })
    } finally {
      controllerMap.delete(job.id)
    }
  })()

  return NextResponse.json({ jobId: job.id })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const db = prisma as any
  const job = await db.generationJob.findUnique({ where: { id } })
  if (!job) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ job })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const ctrl = controllerMap.get(id)
  if (ctrl) {
    ctrl.abort()
    controllerMap.delete(id)
  }
  const db = prisma as any
  await db.generationJob.update({ where: { id }, data: { status: 'aborted', abortedAt: new Date() } }).catch(() => {})
  return NextResponse.json({ ok: true })
}
