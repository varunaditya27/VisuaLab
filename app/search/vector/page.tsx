"use client"

import { useEffect, useState } from 'react'
import { Search, Image as ImageIcon, Sparkles } from 'lucide-react'

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

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-holographic">Visual Search</h1>
          <p className="text-gray-600">Find images by meaning. This is different from keyword search in Gallery.</p>
        </div>
      </div>

      {/* Query card */}
      <form onSubmit={submit} className="card-quantum p-5">
        <div className="mb-4 grid grid-cols-2 gap-2 glass-subtle rounded-2xl p-2 w-full sm:w-[420px]">
          <button type="button" onClick={() => setMode('text')} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${mode==='text' ? 'bg-aurora-primary text-white shadow-aurora-glow' : 'text-gray-600 hover:text-electric-blue hover:bg-white/20'}`}>
            <span className="inline-flex items-center gap-2"><Search size={16}/> Text</span>
          </button>
          <button type="button" onClick={() => setMode('image')} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${mode==='image' ? 'bg-aurora-primary text-white shadow-aurora-glow' : 'text-gray-600 hover:text-electric-blue hover:bg-white/20'}`}>
            <span className="inline-flex items-center gap-2"><ImageIcon size={16}/> Image</span>
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <div className="relative w-56">
            <select value={albumId} onChange={e => setAlbumId(e.target.value)} className="input-neural appearance-none w-full pr-8">
              <option value="">All albums</option>
              {albums.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
          </div>
        </div>

    {mode === 'text' ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input className="input-neural flex-1" placeholder="Describe an image (e.g. ‘sunset over mountains’)" value={text ?? ''} onChange={e => setText(e.target.value ?? '')} />
            <button className="btn-holo primary" disabled={loading || (text ?? '').trim().length === 0}>
              <Sparkles size={16} className="mr-2"/>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="input-neural" />
            <button className="btn-holo primary" disabled={loading || !file}>
              <Sparkles size={16} className="mr-2"/>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        )}
      </form>

      {/* Results */}
      <div className="mt-6">
        {error && (
          <div className="glass-subtle rounded-2xl p-3 border border-red-300 text-red-600 text-sm mb-4">{error}</div>
        )}
        {results.length === 0 ? (
          <div className="glass-subtle rounded-2xl p-6 text-gray-600 text-sm">No results yet. Try a descriptive prompt or upload a reference image.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {results.map(r => (
              <a key={r.imageId} href={`/admin/editor?imageId=${encodeURIComponent(r.imageId)}`} className="block group card-quantum overflow-hidden">
                <img src={r.thumbUrl || ''} alt={r.title || ''} className="w-full h-40 object-cover rounded" />
                <div className="p-3 flex items-center justify-between text-xs text-gray-600">
                  <div className="truncate max-w-[70%]">{r.title || 'Untitled'}</div>
                  <div className="text-gray-400">{r.score.toFixed(3)}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
