"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Scissors, ArrowLeft, Wand2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { LinkButton } from '@/components/ui/LinkButton'
import { Button } from '@/components/ui/Button'
const ProImageEditor = dynamic(() => import('@/components/ProImageEditor'), { ssr: false })

type ImageLite = { id: string; title?: string | null; thumbUrl?: string | null }

// Wrapper to satisfy Next.js requirement: useSearchParams must be within a Suspense boundary
export default function AdminEditorPage() {
  return (
    <Suspense fallback={
      <div className="container py-12">
        <div className="card-quantum max-w-md mx-auto p-8 text-center">
          <h2 className="font-heading text-2xl mb-2">Loading Image Editor…</h2>
          <p className="text-gray-600">Preparing editor...</p>
        </div>
      </div>
    }>
      <AdminEditorClient />
    </Suspense>
  )
}

function AdminEditorClient() {
  const params = useSearchParams()
  const [images, setImages] = useState<ImageLite[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [basePreview, setBasePreview] = useState<string | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState('')
  const [hydrated, setHydrated] = useState(false)

  // Ops state
  // legacy state removed; using embedded editor now

  const [role, setRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('VIEWER')

  // Hydration guard + role detection
  useEffect(() => {
    setHydrated(true)
    const m = document.cookie.match(/(?:^|; )rbacRoleClient=([^;]+)/)
    const r = m ? decodeURIComponent(m[1]) : 'VIEWER'
    setRole(r === 'ADMIN' || r === 'EDITOR' ? (r as 'ADMIN' | 'EDITOR') : 'VIEWER')
  }, [])

  // Load initial images and preselect if query has imageId
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/images', { cache: 'no-store', credentials: 'include' })
        const data = await res.json()
        setImages(data.images || [])
        const initial = params.get('imageId')
        if (initial) setSelectedId(initial)
      } catch {}
    })()
  }, [params])

  // legacy transform effect removed

  // Load base preview when selection changes
  useEffect(() => {
    if (!selectedId) { 
      setPreview(null)
      setBasePreview(null)
      return 
    }
    ;(async () => {
      try {
        const res = await fetch(`/api/images?imageId=${selectedId}`, { cache: 'no-store', credentials: 'include' })
        const data = await res.json()
  const url = data?.images?.[0]?.thumbUrl || null
  const orig = data?.images?.[0]?.originalUrl || url
  setPreview(url)
  setBasePreview(url)
  setOriginalUrl(orig)
  // no legacy ops to reset
      } catch { 
        setPreview(null)
        setBasePreview(null)
      }
    })()
  }, [selectedId])

  // moved guards below all hooks to keep hook order consistent across renders

  // legacy apply/undo/redo removed; embedded editor handles UI/ops

  const filtered = images.filter(i => !filter || (i.title || '').toLowerCase().includes(filter.toLowerCase()))

  // legacy server preview removed

  // legacy keyboard shortcuts removed

  // legacy mouse handlers removed

  // Guard rendering after all hooks
  if (!hydrated) {
    return (
      <div className="container py-12">
        <div className="card-quantum max-w-md mx-auto p-8 text-center">
          <h2 className="font-heading text-2xl mb-2">Loading Image Editor…</h2>
          <p className="text-gray-600">Please wait.</p>
        </div>
      </div>
    )
  }

  if (!(role === 'ADMIN' || role === 'EDITOR')) {
    return (
      <div className="container py-12">
        <div className="card-quantum max-w-md mx-auto p-8 text-center">
          <Scissors className="mx-auto mb-3 text-electric-blue" />
          <h2 className="font-heading text-2xl mb-2">Editor Access Required</h2>
          <p className="text-gray-600">Sign in with an Admin or Editor account to use the image editor.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkButton href="/admin" className="!bg-transparent !border-none inline-flex items-center gap-2"><ArrowLeft size={16}/> Back</LinkButton>
          <h1 className="font-heading text-2xl">Image Editor</h1>
        </div>
        <div className="text-sm text-gray-500">Full-featured editor • All tools inside the canvas UI</div>
      </div>

      <div className="grid md:grid-cols-12 gap-4 h-[80vh]">
        {/* Sidebar: image list + search */}
        <div className="md:col-span-4 card-quantum p-4 flex flex-col">
          <div className="mb-3 flex items-center gap-2">
            <input className="input-neural w-full" placeholder="Search images by title" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto grid grid-cols-3 md:grid-cols-2 gap-2 pr-1">
            {filtered.map(img => (
              <Button key={img.id} className={`relative block text-left ${selectedId===img.id ? 'ring-2 ring-electric-blue rounded' : ''} !p-0 !bg-transparent !border-none`} onClick={() => setSelectedId(img.id)}>
                <img src={img.thumbUrl ?? ''} alt={img.title ?? ''} className="w-full h-24 object-cover rounded" />
                <div className="mt-1 truncate text-xs text-gray-600">{img.title ?? 'Untitled'}</div>
              </Button>
            ))}
            {filtered.length === 0 && (
              <div className="text-sm text-gray-500 col-span-full">No images found.</div>
            )}
          </div>
        </div>

        {/* Main: embedded editor only */}
        <div className="md:col-span-8 space-y-4">
          <div className="editor-card h-full">
            <div className="editor-card-header">
              <h3 className="font-heading text-lg flex items-center gap-2"><Wand2 size={18}/> Editor</h3>
            </div>
            {preview ? (
              <ProImageEditor 
                src={selectedId ? `/api/images/original?imageId=${selectedId}` : (originalUrl || preview)}
                onSave={async (blob) => {
                  if (!selectedId) return
                  const form = new FormData()
                  form.append('imageId', selectedId)
                  form.append('file', blob, 'edited.jpg')
                  const res = await fetch('/api/images/saveEdited', { method: 'POST', body: form, credentials: 'include' })
                  if (res.ok) {
                    const fresh = await fetch(`/api/images?imageId=${selectedId}`, { cache: 'no-store', credentials: 'include' }).then(r => r.json())
                    const next = fresh?.images?.[0]?.thumbUrl as string | undefined
                    setPreview(next || (preview ? `${preview.split('?')[0]}?t=${Date.now()}` : null))
                  }
                }}
              />
            ) : (
              <div className="text-sm text-gray-500">{selectedId ? 'Loading…' : 'Select an image from the left'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}