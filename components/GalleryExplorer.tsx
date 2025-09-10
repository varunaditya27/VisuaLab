"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Search, Tags, Filter, ChevronDown, SortAsc, LayoutGrid, Loader2 } from 'lucide-react'

const GalleryGrid = dynamic(() => import('./GalleryGrid').then(m => m.GalleryGrid), { ssr: false })

type ImageRec = { id: string; title?: string | null; thumbUrl?: string | null }

type SortKey = 'new' | 'liked' | 'views'

function useDebounced<T>(value: T, delay = 400) {
  const [deb, setDeb] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return deb
}

export default function GalleryExplorer({ initial }: { initial: { images: ImageRec[]; album?: string | null; q?: string; tags?: string; from?: string; to?: string; license?: string } }) {
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // UI state derived from URL or initial
  const [q, setQ] = useState<string>(sp.get('q') || initial.q || '')
  const [tags, setTags] = useState<string>(sp.get('tags') || initial.tags || '')
  const [album, setAlbum] = useState<string>(sp.get('album') || initial.album || '')
  const [sort, setSort] = useState<SortKey>((sp.get('sort') as SortKey) || 'new')

  const [images, setImages] = useState<ImageRec[]>(initial.images || [])
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [albums, setAlbums] = useState<Array<{ id: string; name: string }>>([])

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Fetch albums once for filter
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/albums', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setAlbums(data.albums?.map((a: any) => ({ id: a.id, name: a.name })) || [])
        }
      } catch {}
    })()
  }, [])

  // Sync URL
  const debQ = useDebounced(q)
  const debTags = useDebounced(tags)
  useEffect(() => {
    const params = new URLSearchParams(sp.toString())
    if (debQ) params.set('q', debQ); else params.delete('q')
    if (debTags) params.set('tags', debTags); else params.delete('tags')
    if (album) params.set('album', album); else params.delete('album')
    if (sort && sort !== 'new') params.set('sort', sort); else params.delete('sort')
    router.replace(`${pathname}?${params.toString()}`)
  }, [debQ, debTags, album, sort, router, pathname, sp])

  // Fetch page
  const fetchPage = useCallback(async (pageNumber: number, append: boolean) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (tags) params.set('tags', tags)
    if (album) params.set('album', album)
    if (sort) params.set('sort', sort)
    params.set('page', String(pageNumber))
    params.set('pageSize', '24')
    try {
      const res = await fetch(`/api/images?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      if (append) setImages(prev => [...prev, ...(data.images || [])])
      else setImages(data.images || [])
      setHasMore(Boolean(data.hasMore))
    } catch {
      if (!append) setImages([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [q, tags, album, sort])

  // Reset when filters change
  useEffect(() => {
    setPage(1)
    fetchPage(1, false)
  }, [debQ, debTags, album, sort, fetchPage])

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return
    const el = sentinelRef.current
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !loading && hasMore) {
          const next = page + 1
          setPage(next)
          fetchPage(next, true)
        }
      })
    }, { rootMargin: '600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [page, loading, hasMore, fetchPage])

  const filterChips = useMemo(() => {
    const chips: Array<{ k: string; v: string; onClear: () => void }> = []
    if (q) chips.push({ k: 'Query', v: `“${q}”`, onClear: () => setQ('') })
    if (tags) chips.push({ k: 'Tags', v: tags, onClear: () => setTags('') })
    if (album) chips.push({ k: 'Album', v: album === 'none' ? 'Unassigned' : albums.find(a => a.id === album)?.name || 'Album', onClear: () => setAlbum('') })
    return chips
  }, [q, tags, album, albums])

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:w-auto md:flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search..."
              className="input w-full pl-10"
            />
          </div>
          <div className="relative w-full md:w-52">
            <Tags size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="Filter by tag"
              className="input w-full pl-10"
            />
          </div>
          <div className="relative w-full md:w-48">
            <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              value={album}
              onChange={e => setAlbum(e.target.value)}
              className="input appearance-none w-full pl-10 pr-8"
            >
              <option value="">All albums</option>
              <option value="none">Unassigned</option>
              {albums.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="relative w-full md:w-40">
          <SortAsc size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="input appearance-none w-full pl-10 pr-8"
          >
            <option value="new">Newest</option>
            <option value="liked">Most liked</option>
            <option value="views">Most viewed</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Active filter chips */}
      {filterChips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filterChips.map((c, i) => (
            <button key={i} className="chip" onClick={c.onClear} title="Clear">
              <span className="font-medium mr-1">{c.k}:</span> {c.v}
              <span className="ml-2 font-mono">×</span>
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <GalleryGrid images={images} />

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-12" />

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading more…
        </div>
      )}

      {/* End message */}
      {!loading && images.length > 0 && !hasMore && (
        <div className="text-center py-8 text-muted-foreground">You’ve reached the end.</div>
      )}
    </div>
  )
}