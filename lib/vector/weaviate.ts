type Vec = number[]

const W_URL = (process.env.WEAVIATE_URL || '').replace(/^https?:\/\//, '')
const W_BASE = W_URL ? `https://${W_URL}` : ''
const W_KEY = process.env.WEAVIATE_API_KEY
const W_CLASS = process.env.WEAVIATE_CLASS || 'Image'

function headersJSON() {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (W_KEY) h['Authorization'] = `Bearer ${W_KEY}`
  return h
}

export async function weaviateUpsertImage(id: string, vector: Vec, properties: Record<string, any>) {
  if (!W_BASE) throw new Error('WEAVIATE_URL missing')
  const body = {
    class: W_CLASS,
    properties: { imageId: id, ...properties },
    vector
  }
  // Idempotent upsert using PUT with explicit id; rely on auto schema
  const res = await fetch(`${W_BASE}/v1/objects/${id}`, {
    method: 'PUT',
    headers: headersJSON(),
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Weaviate upsert failed: ${res.status} ${t}`)
  }
}

function graphQLValue(v: any): string {
  if (v === null) return 'null'
  if (typeof v === 'string') return JSON.stringify(v)
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return `[${v.map(graphQLValue).join(',')}]`
  if (typeof v === 'object') {
    return `{ ${Object.entries(v).map(([k, val]) => `${k}: ${graphQLValue(val)}`).join(', ')} }`
  }
  return 'null'
}

export async function weaviateQuery(vector: Vec, topK = 20, where?: Record<string, any>) {
  if (!W_BASE) throw new Error('WEAVIATE_URL missing')
  const whereStr = where ? `, where: ${graphQLValue(where)}` : ''
  const res = await fetch(`${W_BASE}/v1/graphql`, {
    method: 'POST',
    headers: headersJSON(),
    body: JSON.stringify({ query: `{
      Get { ${W_CLASS}(
        nearVector: { vector: [${vector.join(',')}] }${topK?`, limit: ${topK}`:''}${whereStr}
      ) {
        imageId _additional { distance }
      } }
    }` })
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Weaviate query failed: ${res.status} ${t}`)
  }
  const json = await res.json()
  const items = (((json?.data?.Get || {})[W_CLASS]) || []) as Array<any>
  return items.map(i => ({ imageId: i.imageId as string, score: 1 - (i?._additional?.distance ?? 1) }))
}
