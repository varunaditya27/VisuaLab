import { r2PublicUrl } from '@/lib/r2'

type ImageRec = {
  id: string
  title?: string | null
  thumbUrl?: string | null
}

export function GalleryGrid({ images }: { images: ImageRec[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {images?.map((img) => {
        const src = img.thumbUrl ?? null
        return (
          <a key={img.id} href="#" className="group overflow-hidden rounded-md border bg-white">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={img.title ?? ''} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
            ) : (
              <div className="flex h-32 items-center justify-center text-xs text-gray-400">No preview</div>
            )}
          </a>
        )
      })}
    </div>
  )
}
