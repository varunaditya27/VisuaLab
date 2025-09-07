import { prisma } from '@/lib/prisma'
import { GalleryGrid } from '@/components/GalleryGrid'

export default async function HomePage() {
  let images: Array<{ id: string; title: string | null; thumbKey: string | null }> = []
  try {
    images = await prisma.image.findMany({
      select: { id: true, title: true, thumbKey: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  } catch {
    images = []
  }
  return (
    <div>
      <h2 className="mb-4 text-lg font-medium">Gallery</h2>
      <GalleryGrid images={images} />
    </div>
  )
}
