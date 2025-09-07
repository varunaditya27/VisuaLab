import dynamic from 'next/dynamic'
const GalleryGrid = dynamic(() => import('@/components/GalleryGrid').then(m => m.GalleryGrid), { ssr: false })

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
