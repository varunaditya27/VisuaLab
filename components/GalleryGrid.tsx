"use client"

import { motion } from 'framer-motion'

type ImageRec = {
  id: string
  title?: string | null
  thumbUrl?: string | null
}

export function GalleryGrid({ images }: { images: ImageRec[] }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  }
  const item = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  }
  return (
    <motion.div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {images?.map((img) => {
        const src = img.thumbUrl ?? null
        return (
          <motion.a key={img.id} href="#" className="card group overflow-hidden" variants={item} whileHover={{ y: -2 }}>
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={img.title ?? ''} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
            ) : (
              <div className="flex h-32 items-center justify-center text-xs text-gray-400">No preview</div>
            )}
          </motion.a>
        )
      })}
    </motion.div>
  )
}
