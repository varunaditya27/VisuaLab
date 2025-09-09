export type Embedding = number[]

export interface VectorProvider {
  name: string
  dim: number
  embedText(text: string, signal?: AbortSignal): Promise<Embedding>
  embedImageFromUrl(url: string, signal?: AbortSignal): Promise<Embedding>
  embedImageFromBuffer(buf: Buffer, signal?: AbortSignal): Promise<Embedding>
}

// Default to a widely-available CLIP model on HF that supports text+image embedding
const ENV_MODEL = process.env.HF_EMBEDDING_MODEL
const DEFAULT_MODEL = 'sentence-transformers/clip-ViT-L-14'
const SECONDARY_MODEL = 'sentence-transformers/clip-ViT-B-32'
const MODELS_TO_TRY = Array.from(new Set([ENV_MODEL, DEFAULT_MODEL, SECONDARY_MODEL].filter(Boolean))) as string[]

function meanPool2D(arr: number[][]): Embedding {
  const n = arr.length
  const d = arr[0]?.length || 0
  const out = new Array(d).fill(0)
  for (let i = 0; i < n; i++) {
    const row = arr[i]
    for (let j = 0; j < d; j++) out[j] += row[j]
  }
  if (n > 0) for (let j = 0; j < d; j++) out[j] /= n
  return out
}

function to1DEmbedding(resp: any): Embedding {
  // Handle shapes: [dim], [seq, dim], [1, seq, dim]
  if (Array.isArray(resp) && resp.length > 0) {
    if (typeof resp[0] === 'number') {
      return resp as Embedding
    }
    if (Array.isArray(resp[0]) && resp[0].length && typeof resp[0][0] === 'number') {
      // 2D: [seq, dim] -> mean pool
      return meanPool2D(resp as number[][])
    }
    if (Array.isArray(resp[0]) && Array.isArray(resp[0][0])) {
      // 3D or more: trim leading singleton dims
      let cur: any = resp
      while (Array.isArray(cur) && cur.length === 1) cur = cur[0]
      if (Array.isArray(cur) && cur.length > 0 && Array.isArray(cur[0]) && typeof cur[0][0] === 'number') {
        return meanPool2D(cur as number[][])
      }
    }
  }
  throw new Error('Unexpected embedding format from HF')
}

function l2normalize(vec: Embedding): Embedding {
  let sum = 0
  for (const v of vec) sum += v * v
  const norm = Math.sqrt(sum)
  if (!isFinite(norm) || norm === 0) return vec
  return vec.map(v => v / norm)
}

import { InferenceClient } from '@huggingface/inference'

export class HFClipProvider implements VectorProvider {
  name = 'hf-clip'
  // Dimension varies by model (e.g., ViT-L/14: 768, ViT-B/32: 512). Set to 0 to indicate dynamic.
  dim = 0
  private client: InferenceClient
  constructor() {
    const token = process.env.HUGGINGFACE_API_TOKEN || process.env.HF_TOKEN
    if (!token) throw new Error('HUGGINGFACE_API_TOKEN missing')
    this.client = new InferenceClient(token)
  }
  async embedText(text: string, signal?: AbortSignal): Promise<Embedding> {
    const errors: string[] = []
    for (const m of MODELS_TO_TRY) {
      try {
        const out = await this.client.featureExtraction({ model: m, inputs: text, options: { wait_for_model: true }, signal })
        return l2normalize(to1DEmbedding(out))
      } catch (e: any) {
        const msg = e?.message || String(e)
        errors.push(`${m}: ${msg}`)
      }
    }
    throw new Error(`HF embeddings failed for all models: ${errors.join(' | ')}`)
  }
  async embedImageFromUrl(url: string, signal?: AbortSignal): Promise<Embedding> {
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`)
    const blob = await res.blob()
    return this.embedImageFromBlob(blob, signal)
  }
  async embedImageFromBuffer(buf: Buffer, signal?: AbortSignal): Promise<Embedding> {
    // Convert Node Buffer to a Blob in a TS-safe way
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  const blob = new Blob([new Uint8Array(ab)])
    return this.embedImageFromBlob(blob, signal)
  }
  private async embedImageFromBlob(blob: Blob, signal?: AbortSignal): Promise<Embedding> {
    const errors: string[] = []
    for (const m of MODELS_TO_TRY) {
      try {
    const out = await this.client.featureExtraction({ model: m, inputs: blob as any, options: { wait_for_model: true }, signal })
        return l2normalize(to1DEmbedding(out))
      } catch (e: any) {
        const msg = e?.message || String(e)
        errors.push(`${m}: ${msg}`)
      }
    }
    throw new Error(`HF image embeddings failed for all models: ${errors.join(' | ')}`)
  }
}

export function getVectorProvider(): VectorProvider {
  // In future allow switching via env VECTOR_PROVIDER
  return new HFClipProvider()
}
