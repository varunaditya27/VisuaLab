"use client"

import { useEffect, useMemo, useState } from 'react'
import UploadForm from '@/components/UploadForm'
import { Button } from '@/components/ui/Button'
import { LinkButton } from '@/components/ui/LinkButton'
import { Plus, RefreshCw, FolderOpen, Images, Settings, Shield, LogIn, Scissors, BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

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
        <div className="max-w-md mx-auto p-8 text-center rounded-2xl bg-card shadow-lg">
          <Shield className="mx-auto mb-3 text-primary" />
          <h2 className="font-heading text-2xl mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in with an admin account to use the dashboard.</p>
          <Button className="inline-flex items-center gap-2" onClick={() => promptLogin('login')}>
            <LogIn size={16} /> Sign in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Welcome Header */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10">
        <h1 className="font-heading text-3xl font-bold">Welcome, Admin</h1>
  <p className="text-muted-foreground">Here&apos;s a snapshot of your VisuaLab.</p>
      </div>
      
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold">Command Center</h2>
  <Button className="inline-flex items-center gap-2" onClick={refreshAll} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </Button>
      </div>

      {/* Dashboard Grid */}
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Left Column */}
        <div className="md:col-span-1 lg:col-span-1 space-y-6">
          {/* Quick Actions */}
          <div className="p-4 rounded-2xl bg-card shadow">
            <h3 className="font-heading text-lg mb-4 flex items-center gap-2"><Plus size={18} /> Quick Actions</h3>
            <div className="space-y-3">
              <UploadForm onUploaded={refreshAll} />
              <form onSubmit={createAlbum} className="space-y-3">
                <input className="input w-full" placeholder="New album name" value={albumName} onChange={(e) => setAlbumName(e.target.value)} />
                <Button className="w-full inline-flex items-center gap-2" disabled={creatingAlbum}>
                  <FolderOpen size={16} /> Create Album
                </Button>
              </form>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="p-4 rounded-2xl bg-card shadow">
            <h3 className="font-heading text-lg mb-4 flex items-center gap-2"><Settings size={18} /> Navigation</h3>
            <div className="flex flex-col space-y-2">
              <LinkButton href="/gallery">Open Gallery</LinkButton>
              <LinkButton href="/albums">Manage Albums</LinkButton>
              <LinkButton href="/admin/editor">Image Editor</LinkButton>
              <LinkButton href="/admin/generator">AI Generator</LinkButton>
              <LinkButton href="/admin/palette">Theme Editor</LinkButton>
            </div>
          </div>
        </div>

        {/* Center Column */}
        <div className="md:col-span-2 lg:col-span-2 space-y-6">
          {/* Analytics */}
          <div className="p-4 rounded-2xl bg-card shadow">
            <h3 className="font-heading text-lg mb-4 flex items-center gap-2"><BarChart2 size={18} /> Analytics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 text-center">Top Viewed</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.topViews} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="id" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(val) => `ID ${val.slice(-4)}`} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--popover-foreground))'
                      }}
                      labelFormatter={(val) => `Image ID: ${val}`}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 text-center">Top Liked</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.topLikes} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="id" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(val) => `ID ${val.slice(-4)}`} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--popover-foreground))'
                      }}
                      labelFormatter={(val) => `Image ID: ${val}`}
                    />
                    <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Recent Images */}
          <div className="p-4 rounded-2xl bg-card shadow">
            <h3 className="font-heading text-lg mb-4 flex items-center gap-2"><Images size={18} /> Recent Images</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {images.slice(0, 10).map(img => (
                <a key={img.id} className="block text-left group" href={`/admin/editor?imageId=${encodeURIComponent(img.id)}`}>
                  <img src={img.thumbUrl ?? ''} alt={img.title ?? ''} className="w-full h-24 object-cover rounded-lg transition-transform group-hover:scale-105" />
                  <div className="mt-1 truncate text-xs text-muted-foreground">{img.title ?? 'Untitled'}</div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-3 lg:col-span-1 space-y-6">
          {/* Albums list */}
          <div className="p-4 rounded-2xl bg-card shadow">
            <h3 className="font-heading text-lg mb-4 flex items-center gap-2"><FolderOpen size={18} /> Albums</h3>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {albums.length === 0 && <p className="text-sm text-muted-foreground">No albums yet.</p>}
              {albums.map(a => (
                <div key={a.id} className="bg-background/50 rounded-xl px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a._count?.images ?? 0} images</p>
                  </div>
                  <LinkButton className="text-xs px-2 py-1" href={`/gallery?album=${encodeURIComponent(a.id)}`}>View</LinkButton>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Batch Operations */}
      <div className="mt-8 p-6 rounded-2xl bg-card shadow">
        <h3 className="font-heading text-xl mb-4">Batch Operations</h3>
        <div className="mb-3 text-sm text-muted-foreground">Select images below to move or apply other actions.</div>
        <div className="flex items-center gap-3 mb-4">
          <select className="input" value={batchAlbum} onChange={(e) => setBatchAlbum(e.target.value)}>
            <option value="">Move to album...</option>
            <option value="__none__">Unassign album</option>
            {albums.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
          </select>
          <Button onClick={async () => {
            if (!batchAlbum) return
            const ids = Object.entries(batchSelection).filter(([, v]) => v).map(([k]) => k)
            const toAlbumId = batchAlbum === '__none__' ? null : batchAlbum
            await Promise.all(ids.map(id => fetch('/api/images/edit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, albumId: toAlbumId }) })))
            setBatchSelection({})
            refreshAll()
          }}>Move Selected</Button>
          <Button onClick={() => setBatchSelection({})} className="!bg-transparent !border-none text-muted-foreground hover:text-white">Clear Selection</Button>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 max-h-60 overflow-y-auto pr-1">
          {images.map(img => (
            <label key={img.id} className="relative block cursor-pointer group">
              <input type="checkbox" className="absolute left-2 top-2 z-10 h-5 w-5" checked={!!batchSelection[img.id]} onChange={(e) => setBatchSelection(s => ({ ...s, [img.id]: e.target.checked }))} />
              <img src={img.thumbUrl ?? ''} alt="" className={`w-full h-24 object-cover rounded-lg transition-all ${batchSelection[img.id] ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'group-hover:opacity-80'}`} />
            </label>
          ))}
        </div>
      </div>
 

  {/* Editor drawer removed; use /admin/editor instead */}
    </div>
  )
}