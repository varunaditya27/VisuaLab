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

class PollinationsProvider implements AIImageProvider {
  name = 'pollinations'
  async generate(params: GenerateParams, onLog?: (msg: string) => void, signal?: AbortSignal): Promise<GenerateResult> {
    const width = Math.max(64, Math.min(2048, params.width ?? 768))
    const height = Math.max(64, Math.min(2048, params.height ?? 768))
    const steps = params.steps ?? 28 // not used by API
    const batch = Math.max(1, Math.min(4, params.batch ?? 1))
    const baseSeed = params.seed ?? Math.floor(Math.random() * 1e9)
    const model = process.env.POLLINATIONS_MODEL || 'flux'
    const images: GenerateResult['images'] = []
    onLog?.(`Dispatching to Pollinations model=${model} size=${width}x${height} batch=${batch}`)
    for (let i = 0; i < batch; i++) {
      const seed = baseSeed + i
      const qs = new URLSearchParams()
      qs.set('width', String(width))
      qs.set('height', String(height))
      qs.set('seed', String(seed))
      if (model) qs.set('model', model)
      // Pollinations supports simple negative prompts in the prompt itself, so append if provided
      const prompt = params.negativePrompt ? `${params.prompt}, negative: (${params.negativePrompt})` : params.prompt
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${qs.toString()}`
      onLog?.(`GET ${url}`)
      const res = await fetch(url, { signal })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new Error(`Pollinations request failed: ${res.status} ${t}`)
      }
      const buf = Buffer.from(await res.arrayBuffer())
      const mime = res.headers.get('content-type') || 'image/jpeg'
      images.push({ buffer: buf, mime, safetyTags: [], providerJobId: url })
    }
    return { images, model }
  }
}

class ReplicateProvider implements AIImageProvider {
  name = 'replicate'
  async generate(params: GenerateParams, onLog?: (msg: string) => void, signal?: AbortSignal): Promise<GenerateResult> {
    const token = process.env.REPLICATE_API_TOKEN
    const model = process.env.REPLICATE_MODEL || 'google/imagen-4-fast'
    if (!token) throw new Error('REPLICATE_API_TOKEN missing')
    const width = params.width ?? 768
    const height = params.height ?? 768
    const steps = params.steps ?? 28
    const batch = Math.max(1, Math.min(4, params.batch ?? 1))
    const seed = params.seed
    const negativePrompt = params.negativePrompt || ''

    // Helper: pick aspect ratio closest to given width/height
    const pickAspect = (w: number, h: number) => {
      const target = w / h
      const candidates = [
        { label: '1:1', ratio: 1 / 1 },
        { label: '4:3', ratio: 4 / 3 },
        { label: '3:4', ratio: 3 / 4 },
        { label: '16:9', ratio: 16 / 9 },
        { label: '9:16', ratio: 9 / 16 },
        { label: '3:2', ratio: 3 / 2 },
        { label: '2:3', ratio: 2 / 3 },
      ] as const
      let best: typeof candidates[number] = candidates[0]
      let bestDiff = Math.abs(best.ratio - target)
      for (const c of candidates) {
        const d = Math.abs(c.ratio - target)
        if (d < bestDiff) { best = c; bestDiff = d }
      }
      return best.label
    }

    onLog?.(`Dispatching to Replicate model=${model} size=${width}x${height} batch=${batch}`)

    const runOnce = async (): Promise<{ id: string; output: any }> => {
      const isImagen = model.toLowerCase().includes('google/imagen-4-fast')
      const input = isImagen
        ? {
            prompt: params.prompt,
            aspect_ratio: pickAspect(width, height),
            output_format: 'jpg',
            safety_filter_level: 'block_only_high',
          }
        : {
            prompt: params.prompt,
            negative_prompt: negativePrompt,
            width,
            height,
            steps,
            seed,
            num_outputs: 1,
          }
      const body = { input, model }
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
      return { id, output }
    }

    const images: GenerateResult['images'] = []
    for (let i = 0; i < batch; i++) {
      const { id, output } = await runOnce()
      // Normalize output into URL list
      let urls: string[] = []
      if (typeof output === 'string') urls = [output]
      else if (Array.isArray(output)) {
        // Could be array of strings or array of file objects
        urls = (output.map((o: any) => (typeof o === 'string' ? o : o?.url)).filter(Boolean))
      } else if (output && typeof output === 'object') {
        if (output.url) urls = [output.url]
        else if (Array.isArray(output.files)) urls = (output.files.map((f: any) => f?.url).filter(Boolean))
      }
      if (urls.length === 0) onLog?.('No URLs found in Replicate output')
      for (const u of urls) {
        const fr = await fetch(u)
        const buf = Buffer.from(await fr.arrayBuffer())
        images.push({ buffer: buf, mime: fr.headers.get('content-type') || 'image/jpeg', safetyTags: [], providerJobId: u })
      }
    }
    return { images, model }
  }
}

export function getProvider(provider?: string): AIImageProvider {
  const p = (provider || process.env.AI_PROVIDER || 'pollinations').toLowerCase()
  if (p === 'pollinations') {
    return new PollinationsProvider()
  }
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
