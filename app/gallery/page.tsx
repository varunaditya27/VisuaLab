import GalleryExplorer from '@/components/GalleryExplorer'
import TagCloud from '@/components/TagCloud'

async function fetchImages(params: { album?: string | null; q?: string; tags?: string; from?: string; to?: string; license?: string } = {}) {
  try {
    const sp = new URLSearchParams()
    if (params.album) sp.set('album', params.album)
    if (params.q) sp.set('q', params.q)
    if (params.tags) sp.set('tags', params.tags)
    if (params.from) sp.set('from', params.from)
    if (params.to) sp.set('to', params.to)
    if (params.license) sp.set('license', params.license)
    const qs = sp.toString()
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/images${qs ? `?${qs}` : ''}`, { cache: 'no-store' })
    if (!res.ok) return { images: [] }
    return res.json()
  } catch {
    return { images: [] }
  }
}

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams
  const album = typeof sp.album === 'string' ? sp.album : null
  const q = typeof sp.q === 'string' ? sp.q : undefined
  const tags = typeof sp.tags === 'string' ? sp.tags : undefined
  const from = typeof sp.from === 'string' ? sp.from : undefined
  const to = typeof sp.to === 'string' ? sp.to : undefined
  const license = typeof sp.license === 'string' ? sp.license : undefined
  const { images } = await fetchImages({ album, q, tags, from, to, license })

  return (
    <div>
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr,minmax(280px,420px)] items-start">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-1">Gallery</h1>
            <p className="text-muted-foreground">Browse all creations{album ? ` in ${album}` : ''}.</p>
          </div>
          {images.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">{images.length} {images.length === 1 ? 'Image' : 'Images'}</span>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-4">
          <h2 className="font-heading text-sm uppercase tracking-wide text-muted-foreground mb-2">Explore by tags</h2>
          <TagCloud limit={48} />
        </aside>
      </div>

      <GalleryExplorer initial={{ images, album, q: q || undefined, tags: tags || undefined, from, to, license }} />
    </div>
  )
}