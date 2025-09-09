"use client"

import { useEffect, useMemo, useRef, useState } from 'react'

type Job = {
  id: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'aborted'
  logs?: string[]
  resultImageIds?: string[]
}

type ImageLite = { id: string; title?: string | null; thumbUrl?: string | null }

export default function GeneratorPage() {
  const [prompt, setPrompt] = useState('A neon cyberpunk cityscape, rain, reflections, ultra-detailed')
  const [negative, setNegative] = useState('blurry, low quality, watermark, text')
  const [seed, setSeed] = useState<number | undefined>(undefined)
  const [steps, setSteps] = useState(28)
  const [width, setWidth] = useState(768)
  const [height, setHeight] = useState(768)
  const [batch, setBatch] = useState(1)
  const [albumId, setAlbumId] = useState('')
  const [consent, setConsent] = useState(false)
  const [provider, setProvider] = useState('replicate')
  const [albums, setAlbums] = useState<Array<{ id: string; name: string }>>([])

  const [jobId, setJobId] = useState<string | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [images, setImages] = useState<ImageLite[]>([])
  const pollRef = useRef<number | null>(null)

  const loggedIn = useMemo(() => {
    if (typeof document === 'undefined') return false
    const u = document.cookie.match(/(?:^|; )rbacUsernameClient=([^;]+)/)
    return !!u
  }, [])

  useEffect(() => {
    fetch('/api/albums').then(r => r.json()).then(d => setAlbums(d.albums || [])).catch(() => {})
  }, [])

  async function startJob() {
    setImages([])
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, negativePrompt: negative, seed, steps, width, height, batch, albumId: albumId || undefined, consentNSFW: consent, provider })
    })
    if (!res.ok) {
      alert('Failed to start job')
      return
    }
    const d = await res.json()
    setJobId(d.jobId)
  }

  async function abortJob() {
    if (!jobId) return
    await fetch(`/api/generate?id=${encodeURIComponent(jobId)}`, { method: 'DELETE' })
    if (pollRef.current) window.clearInterval(pollRef.current)
    pollRef.current = null
    setJobId(null)
  }

  useEffect(() => {
    if (!jobId) return
    const tick = async () => {
      const r = await fetch(`/api/generate?id=${encodeURIComponent(jobId)}`)
      if (!r.ok) return
      const d = await r.json()
      setJob(d.job)
      if (d.job?.status === 'completed') {
        if (pollRef.current) window.clearInterval(pollRef.current)
        pollRef.current = null
        const ids: string[] = d.job.resultImageIds || []
        if (ids.length) {
          const imgs: ImageLite[] = []
          for (const id of ids) {
            const g = await fetch(`/api/images?imageId=${encodeURIComponent(id)}`)
            const j = await g.json()
            const it = j.images?.[0]
            if (it) imgs.push({ id: it.id, thumbUrl: it.thumbUrl })
          }
          setImages(imgs)
        }
      }
      if (d.job?.status === 'failed' || d.job?.status === 'aborted') {
        if (pollRef.current) window.clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
    tick()
    pollRef.current = window.setInterval(tick, 2000)
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); pollRef.current = null }
  }, [jobId])

  if (!loggedIn) {
    return (
      <div className="container py-12">
        <div className="card-quantum max-w-md mx-auto p-8 text-center">
          <h2 className="font-heading text-2xl mb-2">Sign in required</h2>
          <p className="text-gray-600 mb-6">You must be signed in to generate images.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-holographic">AI Image Generator</h1>
        <p className="text-gray-600">Generate images from text prompts and save them to your gallery.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-quantum p-4 md:col-span-2">
          <div className="space-y-3">
            <textarea className="input-neural min-h-28" placeholder="Describe your image..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <input className="input-neural" placeholder="Negative prompt (optional)" value={negative} onChange={(e) => setNegative(e.target.value)} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <input className="input-neural" type="number" placeholder="Seed (optional)" value={seed ?? ''} onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)} />
              <input className="input-neural" type="number" placeholder="Steps" value={steps} onChange={(e) => setSteps(parseInt(e.target.value) || 28)} />
              <input className="input-neural" type="number" placeholder="Batch" value={batch} onChange={(e) => setBatch(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))} />
              <input className="input-neural" type="number" placeholder="Width" value={width} onChange={(e) => setWidth(parseInt(e.target.value) || 768)} />
              <input className="input-neural" type="number" placeholder="Height" value={height} onChange={(e) => setHeight(parseInt(e.target.value) || 768)} />
              <select className="input-neural" value={albumId} onChange={(e) => setAlbumId(e.target.value)}>
                <option value="">No album</option>
                {albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                I consent to viewing potentially NSFW content.
              </label>
              <select className="input-neural max-w-40" value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="replicate">Replicate</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button className="btn-holo primary" onClick={startJob} disabled={!!jobId}>Generate</button>
              <button className="btn-holo ghost" onClick={abortJob} disabled={!jobId}>Abort</button>
            </div>
          </div>
        </div>
        <div className="card-quantum p-4">
          <h3 className="font-heading text-lg mb-2">Job Status</h3>
          <div className="text-sm text-gray-700">{job?.status ?? (jobId ? 'running...' : 'idle')}</div>
          <div className="mt-3 max-h-60 overflow-y-auto text-xs text-gray-600 whitespace-pre-wrap">
            {(job?.logs || []).slice().reverse().map((l: string, i: number) => (<div key={i}>{l}</div>))}
          </div>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="font-heading text-lg mb-2">Results</h3>
        {images.length === 0 && <p className="text-sm text-gray-600">No images yet.</p>}
        <div className="galaxy-grid">
          {images.map(img => (
            <a key={img.id} className="galaxy-grid-item group block" href={`/admin/editor?imageId=${encodeURIComponent(img.id)}`}>
              <img src={img.thumbUrl ?? ''} className="w-full h-56 object-cover rounded-xl" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
