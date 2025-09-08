import dynamic from 'next/dynamic'

const GalleryGrid = dynamic(() => import('@/components/GalleryGrid').then(m => m.GalleryGrid))

async function fetchImages(album?: string | null) {
  try {
    const q = album ? `?album=${encodeURIComponent(album)}` : ''
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/images${q}`, { cache: 'no-store' })
    if (!res.ok) return { images: [] }
    return res.json()
  } catch {
    return { images: [] }
  }
}

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams
  const album = typeof sp.album === 'string' ? sp.album : null
  const { images } = await fetchImages(album)

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-holographic mb-2">Gallery</h1>
          <p className="text-gray-600">Browse all creations{album ? ` in ${album}` : ''}.</p>
        </div>
        {images.length > 0 && (
          <div className="glass-subtle rounded-2xl px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-electric-blue rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-700">{images.length} {images.length === 1 ? 'Image' : 'Images'}</span>
            </div>
          </div>
        )}
      </div>

      <GalleryGrid images={images} />
    </div>
  )
}
