export type GenerateParams = {
  prompt: string
  seed?: number
  steps?: number
  width?: number
  height?: number
  batch?: number
  negativePrompt?: string
}

export type GenerateResult = {
  images: Array<{ buffer: Buffer; mime: string; safetyTags?: string[]; providerJobId?: string }>
  model?: string
}

export interface AIImageProvider {
  name: string
  generate(params: GenerateParams, onLog?: (msg: string) => void, signal?: AbortSignal): Promise<GenerateResult>
}

class ReplicateProvider implements AIImageProvider {
  name = 'replicate'
  async generate(params: GenerateParams, onLog?: (msg: string) => void, signal?: AbortSignal): Promise<GenerateResult> {
    const token = process.env.REPLICATE_API_TOKEN
    const model = process.env.REPLICATE_MODEL || 'black-forest-labs/flux-schnell'
    if (!token) throw new Error('REPLICATE_API_TOKEN missing')
    const width = params.width ?? 768
    const height = params.height ?? 768
    const steps = params.steps ?? 28
    const batch = Math.max(1, Math.min(4, params.batch ?? 1))
    const seed = params.seed
    const negativePrompt = params.negativePrompt || ''
    onLog?.(`Dispatching to Replicate model=${model} size=${width}x${height} steps=${steps} batch=${batch}`)
    const body = {
      input: {
        prompt: params.prompt,
        negative_prompt: negativePrompt,
        width,
        height,
        steps,
        seed,
        num_outputs: batch,
      },
      model,
    }
    const resp = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
    if (!resp.ok) {
      const t = await resp.text().catch(() => '')
      throw new Error(`Replicate request failed: ${resp.status} ${t}`)
    }
    const pred = await resp.json() as any
    let status = pred?.status
    const id = pred?.id
    onLog?.(`prediction id=${id}, status=${status}`)
    let output: any
    while (status && status !== 'succeeded' && status !== 'failed' && status !== 'canceled') {
      await new Promise(r => setTimeout(r, 2000))
      const ps = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { 'Authorization': `Token ${token}` },
        signal,
      })
      if (!ps.ok) throw new Error(`Replicate poll failed: ${ps.status}`)
      const p = await ps.json() as any
      status = p.status
      output = p.output
      onLog?.(`status=${status}`)
    }
    if (status !== 'succeeded') throw new Error(`Generation ${status}`)
    const urls: string[] = Array.isArray(output) ? output : (typeof output === 'string' ? [output] : [])
    const images: GenerateResult['images'] = []
    for (const u of urls) {
      const fr = await fetch(u)
      const buf = Buffer.from(await fr.arrayBuffer())
      images.push({ buffer: buf, mime: fr.headers.get('content-type') || 'image/png', safetyTags: [], providerJobId: id })
    }
    return { images, model }
  }
}

export function getProvider(provider?: string): AIImageProvider {
  const p = (provider || process.env.AI_PROVIDER || 'replicate').toLowerCase()
  if (p === 'replicate') {
    return new ReplicateProvider()
  }
  throw new Error(`Unknown AI provider: ${p}`)
}

export function basicNsfwFilter(tags?: string[]): boolean {
  if (!tags || tags.length === 0) return true
  const blocked = ['porn', 'explicit_nudity', 'sexual_activity']
  return !tags.some(t => blocked.includes(t.toLowerCase()))
}
