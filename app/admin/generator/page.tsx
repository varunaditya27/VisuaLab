"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Sparkles, Loader2 } from 'lucide-react'

type Job = {
  id: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'aborted'
  logs?: string[]
  resultImageIds?: string[]
}

type ImageLite = { id: string; title?: string | null; thumbUrl?: string | null }

export default function GeneratorPage() {
  const [hydrated, setHydrated] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [prompt, setPrompt] = useState('A neon cyberpunk cityscape, rain, reflections, ultra-detailed')
  const [negative, setNegative] = useState('blurry, low quality, watermark, text')
  const [seed, setSeed] = useState<number | undefined>(undefined)
  const [steps, setSteps] = useState(28)
  const [width, setWidth] = useState(768)
  const [height, setHeight] = useState(768)
  const [batch, setBatch] = useState(1)
  const [albumId, setAlbumId] = useState('')
  const [consent, setConsent] = useState(false)
  const [provider, setProvider] = useState('pollinations')
  const [albums, setAlbums] = useState<Array<{ id: string; name: string }>>([])

  const [jobId, setJobId] = useState<string | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [images, setImages] = useState<ImageLite[]>([])
  const pollRef = useRef<number | null>(null)

  useEffect(() => {
    setHydrated(true)
    try {
      const u = document.cookie.match(/(?:^|; )rbacUsernameClient=([^;]+)/)
      setLoggedIn(!!u)
    } catch {
      setLoggedIn(false)
    }
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

// ... (component definition)

  if (!hydrated) {
    return (
      <div className="container py-8 text-center">
        <Loader2 className="mx-auto animate-spin text-primary" size={32} />
        <h2 className="mt-4 font-heading text-2xl">Loading Generator...</h2>
        <p className="text-muted-foreground">Preparing tools.</p>
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto p-8 text-center rounded-2xl bg-card shadow-lg">
          <h2 className="font-heading text-2xl mb-2">Sign in required</h2>
          <p className="text-muted-foreground mb-6">You must be signed in to generate images.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">AI Image Generator</h1>
        <p className="text-muted-foreground">Generate images from text prompts and save them to your gallery.</p>
      </div>
      <div className="grid md:grid-cols-12 gap-6">
        <div className="md:col-span-8">
          <div className="p-6 rounded-2xl bg-card shadow">
            <div className="space-y-4">
              <textarea className="input min-h-28" placeholder="Describe your image..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              <input className="input w-full" placeholder="Negative prompt (optional)" value={negative} onChange={(e) => setNegative(e.target.value)} />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <input className="input" type="number" placeholder="Seed (optional)" value={seed ?? ''} onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)} />
                <input className="input" type="number" placeholder="Steps" value={steps} onChange={(e) => setSteps(parseInt(e.target.value) || 28)} />
                <input className="input" type="number" placeholder="Batch" value={batch} onChange={(e) => setBatch(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))} />
                <input className="input" type="number" placeholder="Width" value={width} onChange={(e) => setWidth(parseInt(e.target.value) || 768)} />
                <input className="input" type="number" placeholder="Height" value={height} onChange={(e) => setHeight(parseInt(e.target.value) || 768)} />
                <select className="input" value={albumId} onChange={(e) => setAlbumId(e.target.value)}>
                  <option value="">No album</option>
                  {albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" className="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  I consent to viewing potentially NSFW content.
                </label>
                <select className="input max-w-48" value={provider} onChange={(e) => setProvider(e.target.value)}>
                  <option value="pollinations">Pollinations (free)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={startJob} disabled={!!jobId} className="inline-flex items-center gap-2">
                  <Sparkles size={16} />
                  {jobId ? 'Generating...' : 'Generate'}
                </Button>
                <Button onClick={abortJob} disabled={!jobId} className="!bg-transparent !border-none text-muted-foreground hover:text-white">Abort</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="md:col-span-4">
          <div className="p-6 rounded-2xl bg-card shadow sticky top-24">
            <h3 className="font-heading text-lg mb-3">Job Status</h3>
            <div className="flex items-center gap-2 text-sm font-medium mb-3">
              {jobId && <Loader2 className="animate-spin" size={16} />}
              <span className="capitalize">{job?.status ?? (jobId ? 'Running...' : 'Idle')}</span>
            </div>
            <div className="bg-background/50 p-3 rounded-lg max-h-64 overflow-y-auto text-xs text-muted-foreground whitespace-pre-wrap space-y-1">
              {(job?.logs || []).slice().reverse().map((l: string, i: number) => (<div key={i}>{l}</div>))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="font-heading text-2xl mb-4">Results</h2>
        {images.length === 0 && <p className="text-sm text-muted-foreground">No images yet. Your generated images will appear here.</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map(img => (
            <a key={img.id} className="group block" href={`/admin/editor?imageId=${encodeURIComponent(img.id)}`}>
              <img src={img.thumbUrl ?? ''} alt={img.title ?? 'Generated image'} className="w-full h-56 object-cover rounded-xl transition-transform group-hover:scale-105" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
