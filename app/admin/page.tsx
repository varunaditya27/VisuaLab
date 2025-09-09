"use client"

import { useEffect, useMemo, useState } from 'react'
import UploadForm from '@/components/UploadForm'
import { Plus, RefreshCw, FolderOpen, Images, Settings, Shield, LogIn, Scissors } from 'lucide-react'

type Album = { id: string; name: string; description?: string | null; _count?: { images: number } }
type ImageLite = { id: string; title?: string | null; thumbUrl?: string | null }

export default function AdminPage() {
  const [role, setRole] = useState<'ADMIN' | 'VIEWER'>('VIEWER')
  const loggedIn = useMemo(() => {
    if (typeof document === 'undefined') return false
    const u = document.cookie.match(/(?:^|; )rbacUsernameClient=([^;]+)/)
    return !!u
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const roleMatch = document.cookie.match(/(?:^|; )rbacRoleClient=([^;]+)/)
    setRole(roleMatch && decodeURIComponent(roleMatch[1]) === 'ADMIN' ? 'ADMIN' : 'VIEWER')
  }, [])

  function promptLogin(tab: 'login' | 'register' = 'login') {
    window.dispatchEvent(new CustomEvent('visuauth:open', { detail: { tab } }))
  }

  const [albums, setAlbums] = useState<Album[]>([])
  const [images, setImages] = useState<ImageLite[]>([])
  const [analytics, setAnalytics] = useState<{ topViews: Array<{ id: string; count: number; thumbUrl?: string | null }>; topLikes: Array<{ id: string; count: number; thumbUrl?: string | null }> }>({ topViews: [], topLikes: [] })
  const [batchSelection, setBatchSelection] = useState<Record<string, boolean>>({})
  const [batchAlbum, setBatchAlbum] = useState<string>('')
  // editor moved to /admin/editor
  const [loading, setLoading] = useState(false)
  const [creatingAlbum, setCreatingAlbum] = useState(false)
  const [albumName, setAlbumName] = useState('')
  const [albumDesc, setAlbumDesc] = useState('')

  async function refreshAll() {
    setLoading(true)
    try {
      const [a, i] = await Promise.all([
        fetch('/api/albums').then(r => r.json()).catch(() => ({ albums: [] })),
        fetch('/api/images').then(r => r.json()).catch(() => ({ images: [] })),
      ])
      setAlbums(a.albums || [])
      setImages(i.images || [])
      // simple analytics by calling counts via existing endpoints (fallback client-side)
      const topLikes = [] as Array<{ id: string; count: number; thumbUrl?: string | null }>
      for (const img of (i.images || []).slice(0, 12)) {
        try {
          const res = await fetch(`/api/likes?imageId=${img.id}`)
          if (res.ok) {
            const d = await res.json()
            topLikes.push({ id: img.id, count: d.count || 0, thumbUrl: img.thumbUrl })
          }
        } catch {}
      }
      topLikes.sort((a, b) => b.count - a.count)
    // views count via GET (no increment)
      const topViews = [] as Array<{ id: string; count: number; thumbUrl?: string | null }>
      for (const img of (i.images || []).slice(0, 12)) {
        try {
      const res = await fetch(`/api/views?imageId=${img.id}`)
          if (res.ok) {
            const d = await res.json()
            topViews.push({ id: img.id, count: d.views || 0, thumbUrl: img.thumbUrl })
          }
        } catch {}
      }
      topViews.sort((a, b) => b.count - a.count)
      setAnalytics({ topLikes: topLikes.slice(0, 5), topViews: topViews.slice(0, 5) })
    } finally { setLoading(false) }
  }

  useEffect(() => { refreshAll() }, [])

  // Editor moved to dedicated /admin/editor page

  async function createAlbum(e: React.FormEvent) {
    e.preventDefault()
    if (!albumName.trim()) return
    setCreatingAlbum(true)
    try {
      const res = await fetch('/api/albums', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: albumName.trim(), description: albumDesc.trim() || undefined }) })
      if (res.ok) {
        setAlbumName('')
        setAlbumDesc('')
        refreshAll()
      }
    } finally { setCreatingAlbum(false) }
  }

  if (!loggedIn || role !== 'ADMIN') {
    return (
      <div className="container py-12">
        <div className="card-quantum max-w-md mx-auto p-8 text-center">
          <Shield className="mx-auto mb-3 text-electric-blue" />
          <h2 className="font-heading text-2xl mb-2">Admin Access Required</h2>
          <p className="text-gray-600 mb-6">Please sign in with an admin account to use the dashboard.</p>
          <button className="btn-holo primary inline-flex items-center gap-2" onClick={() => promptLogin('login')}>
            <LogIn size={16} /> Sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-holographic">Admin Dashboard</h1>
          <p className="text-gray-600">Manage uploads, albums, images, and settings.</p>
        </div>
        <button className="btn-holo ghost inline-flex items-center gap-2" onClick={refreshAll} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

  {/* Dashboard Panels */}
  <div className="glass-strong rounded-2xl p-4">
        <div className="grid md:grid-cols-4 gap-4">
          {/* Upload */}
          <div className="card-quantum p-4">
            <h3 className="font-heading text-lg mb-3 flex items-center gap-2"><Images size={18} /> Upload Images</h3>
            <UploadForm onUploaded={refreshAll} />
          </div>

          {/* Create Album */}
          <div className="card-quantum p-4">
            <h3 className="font-heading text-lg mb-3 flex items-center gap-2"><FolderOpen size={18} /> Create Album</h3>
            <form onSubmit={createAlbum} className="space-y-3">
              <input className="input-neural w-full" placeholder="Album name" value={albumName} onChange={(e) => setAlbumName(e.target.value)} />
              <input className="input-neural w-full" placeholder="Description (optional)" value={albumDesc} onChange={(e) => setAlbumDesc(e.target.value)} />
              <button className="btn-holo primary inline-flex items-center gap-2" disabled={creatingAlbum}>
                <Plus size={16} /> Create
              </button>
            </form>
          </div>

          {/* Albums list */}
          <div className="card-quantum p-4">
            <h3 className="font-heading text-lg mb-3 flex items-center gap-2"><FolderOpen size={18} /> Albums</h3>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {albums.length === 0 && <p className="text-sm text-gray-500">No albums yet.</p>}
              <div className="glass-subtle rounded-xl px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Unassigned</p>
                  <p className="text-xs text-gray-500">Images with no album</p>
                </div>
                <a className="btn-holo ghost text-sm" href={`/gallery?album=none`}>View</a>
              </div>
              {albums.map(a => (
                <div key={a.id} className="glass-subtle rounded-xl px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.name}</p>
                    <p className="text-xs text-gray-500">{a._count?.images ?? 0} images</p>
                  </div>
                  <a className="btn-holo ghost text-sm" href={`/gallery?album=${encodeURIComponent(a.id)}`}>View</a>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Images */}
          <div className="card-quantum p-4">
            <h3 className="font-heading text-lg mb-3 flex items-center gap-2"><Images size={18} /> Recent Images</h3>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {images.length === 0 && <p className="text-sm text-gray-500 col-span-3">No images yet.</p>}
              {images.map(img => (
                <a key={img.id} className="block text-left" href={`/admin/editor?imageId=${encodeURIComponent(img.id)}`}>
                  <img src={img.thumbUrl ?? ''} alt={img.title ?? ''} className="w-full h-20 object-cover rounded-lg" />
                  <div className="mt-1 truncate text-xs text-gray-600">{img.title ?? 'Untitled'}</div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settings & Info */}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="card-quantum p-6">
          <h3 className="font-heading text-lg mb-3 flex items-center gap-2"><Settings size={18} /> Platform Settings</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>Roles: Admin, Editor, Visitor</li>
            <li>Moderation: comments (MAPTCHA), likes per-user</li>
            <li>Storage: R2 signing with public fallback</li>
          </ul>
        </div>
    <div className="card-quantum p-6">
          <h3 className="font-heading text-lg mb-3 flex items-center gap-2"><Shield size={18} /> Quick Links</h3>
          <div className="flex flex-wrap gap-2">
            <a className="btn-holo ghost" href="/gallery">Open Gallery</a>
            <a className="btn-holo ghost" href="/albums">Manage Albums</a>
            <a className="btn-holo ghost" href="/">Homepage</a>
      <a className="btn-holo secondary inline-flex items-center gap-2" href="/admin/editor" title="Open the image editor"><Scissors size={16}/> Image Editor</a>
  <a className="btn-holo ghost" href="/admin/generator">AI Generate</a>
  <a className="btn-holo ghost" href="/admin/palette">Theme</a>
          </div>
        </div>
      </div>

      {/* Analytics + Batch Ops */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="card-quantum p-6">
          <h3 className="font-heading text-lg mb-3">Top Images</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">By Views</h4>
              <div className="space-y-2">
                {analytics.topViews.map(v => (
                  <div key={v.id} className="flex items-center gap-2">
                    <img src={v.thumbUrl ?? ''} className="w-10 h-10 object-cover rounded" />
                    <span className="text-sm text-gray-700">{v.count} views</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">By Likes</h4>
              <div className="space-y-2">
                {analytics.topLikes.map(v => (
                  <div key={v.id} className="flex items-center gap-2">
                    <img src={v.thumbUrl ?? ''} className="w-10 h-10 object-cover rounded" />
                    <span className="text-sm text-gray-700">{v.count} likes</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="card-quantum p-6">
          <h3 className="font-heading text-lg mb-3">Batch Operations</h3>
          <div className="mb-3 text-sm text-gray-600">Select images below to move/edit/delete.</div>
          <div className="flex items-center gap-2 mb-3">
            <select className="input-neural" value={batchAlbum} onChange={(e) => setBatchAlbum(e.target.value)}>
              <option value="">Move to album...</option>
              <option value="__none__">No album</option>
              {albums.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
            </select>
            <button className="btn-holo secondary" onClick={async () => {
              if (!batchAlbum) return
              const ids = Object.entries(batchSelection).filter(([, v]) => v).map(([k]) => k)
              const toAlbumId = batchAlbum === '__none__' ? null : batchAlbum
              await Promise.all(ids.map(id => fetch('/api/images/edit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, albumId: toAlbumId }) })))
              setBatchSelection({})
              refreshAll()
            }}>Move</button>
            <button className="btn-holo ghost" onClick={() => setBatchSelection({})}>Clear</button>
          </div>
          <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
            {images.map(img => (
              <label key={img.id} className="relative block cursor-pointer">
                <input type="checkbox" className="absolute left-1 top-1 z-10" checked={!!batchSelection[img.id]} onChange={(e) => setBatchSelection(s => ({ ...s, [img.id]: e.target.checked }))} />
                <img src={img.thumbUrl ?? ''} alt="" className="w-full h-16 object-cover rounded" />
              </label>
            ))}
          </div>
        </div>
      </div>

  {/* Editor drawer removed; use /admin/editor instead */}
    </div>
  )
}
