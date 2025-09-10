"use client"

import { useEffect, useState } from 'react'
import { Search, Image as ImageIcon, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Loader2 } from 'lucide-react'

type Result = { imageId: string; score: number; title?: string | null; thumbUrl?: string | null }
type Album = { id: string; name: string }

export default function VectorSearchPage() {
  const [mode, setMode] = useState<'text' | 'image'>('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [albums, setAlbums] = useState<Album[]>([])
  const [albumId, setAlbumId] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/albums', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setAlbums((data.albums || []).map((a: any) => ({ id: a.id, name: a.name })))
        }
      } catch {}
    })()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      let res: Response
      const filters = albumId ? { albumId } : undefined
      if (mode === 'image' && file) {
        const form = new FormData()
        form.append('file', file)
        if (filters) form.append('filters', JSON.stringify(filters))
        res = await fetch('/api/search/vector', { method: 'POST', body: form })
      } else {
        res = await fetch('/api/search/vector', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, filters }) })
      }
      if (!res.ok) {
        let message = 'Search failed'
        try { const j = await res.json(); message = j?.error || message } catch {}
        setResults([])
        setError(message)
      } else {
        const data = await res.json()
        setResults(data.results || [])
      }
    } finally { setLoading(false) }
  }

// ... (component definition)

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold">Visual Search</h1>
        <p className="text-muted-foreground">Find images by meaning, not just by keywords.</p>
      </div>

      {/* Query card */}
      <form onSubmit={submit} className="p-6 rounded-2xl bg-card shadow">
        <div className="flex flex-wrap items-center gap-4">
          {/* Mode Toggle */}
          <div className="p-1 rounded-full bg-background flex">
            <button type="button" onClick={() => setMode('text')} className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${mode === 'text' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
              <span className="inline-flex items-center gap-2"><Search size={16}/> Text</span>
            </button>
            <button type="button" onClick={() => setMode('image')} className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${mode === 'image' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
              <span className="inline-flex items-center gap-2"><ImageIcon size={16}/> Image</span>
            </button>
          </div>
          
          {/* Album Filter */}
          <div className="relative">
            <select value={albumId} onChange={e => setAlbumId(e.target.value)} className="input appearance-none pr-8">
              <option value="">All albums</option>
              {albums.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
          </div>
        </div>

        <div className="mt-4">
          {mode === 'text' ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input className="input flex-1" placeholder="Describe an image (e.g. ‘sunset over mountains’)" value={text ?? ''} onChange={e => setText(e.target.value ?? '')} />
              <Button className="inline-flex items-center gap-2" disabled={loading || (text ?? '').trim().length === 0}>
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16} />}
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="input flex-1" />
              <Button className="inline-flex items-center gap-2" disabled={loading || !file}>
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16} />}
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          )}
        </div>
      </form>

      {/* Results */}
      <div className="mt-8">
        {error && (
          <div className="rounded-2xl p-4 border border-destructive/50 bg-destructive/10 text-destructive text-sm mb-4">{error}</div>
        )}
        {results.length === 0 ? (
          <div className="rounded-2xl p-8 text-center border-2 border-dashed border-border">
            <p className="text-muted-foreground">No results yet. Try a descriptive prompt or upload a reference image.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map(r => (
              <a key={r.imageId} href={`/admin/editor?imageId=${encodeURIComponent(r.imageId)}`} className="block group bg-card rounded-lg overflow-hidden shadow transition-all hover:shadow-lg hover:-translate-y-1">
                <img src={r.thumbUrl || ''} alt={r.title || ''} className="w-full h-40 object-cover" />
                <div className="p-3">
                  <div className="font-medium truncate text-sm">{r.title || 'Untitled'}</div>
                  <div className="text-xs text-muted-foreground">Score: {r.score.toFixed(3)}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
