import { GalleryGrid } from '@/components/GalleryGrid'

async function fetchImages() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/images`, { cache: 'no-store' })
  if (!res.ok) return { images: [] }
  return res.json()
}

export default async function HomePage() {
  const { images } = await fetchImages()
  return (
    <div>
      <h2 className="mb-4 text-lg font-medium">Gallery</h2>
  <GalleryGrid images={images} />
    </div>
  )
}
