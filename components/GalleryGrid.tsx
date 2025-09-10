"use client"

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Masonry from 'react-masonry-css'
import { Heart, Sparkles, MessageCircle } from 'lucide-react'
import ImageModal from './ImageModal'
import { staggerContainer, staggerItem } from '@/lib/animations'

type ImageRec = {
  id: string
  title?: string | null
  thumbUrl?: string | null
}

const breakpointColumnsObj = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1
};

function GalleryItem({ image, onImageClick }: { image: ImageRec; onImageClick: (img: ImageRec) => void }) {
  const [likes, setLikes] = useState<Record<string, { count: number; likedByMe: boolean }>>({})
  const [viewer, setViewer] = useState<{ id?: string; username?: string } | null>(null)
  
  useEffect(() => {
    const usernameMatch = document.cookie.match(/(?:^|; )rbacUsernameClient=([^;]+)/)
    if (usernameMatch) setViewer({ username: decodeURIComponent(usernameMatch[1]) })
  }, [])
  
  const loggedIn = !!viewer?.username
  const promptLogin = (tab: 'login' | 'register' = 'login') => {
    window.dispatchEvent(new CustomEvent('visuauth:open', { detail: { tab } }))
  }

  const likeKey = likes[image.id]
  const src = image.thumbUrl ?? null

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -5, scale: 1.02, boxShadow: '0px 10px 30px -5px rgba(0, 0, 0, 0.3)' }}
      className="group relative rounded-lg overflow-hidden mb-4 border border-white/10"
    >
      <div 
        className="relative overflow-hidden cursor-pointer"
        onClick={() => onImageClick(image)}
      >
        {src ? (
          <>
            <motion.img 
              src={src} 
              alt={image.title ?? 'Gallery image'} 
              className="h-auto w-full object-cover"
              loading="lazy"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <motion.div 
              className="absolute bottom-0 left-0 p-4 w-full"
              initial={{ opacity: 0, y: 10 }}
              whileHover={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {image.title && (
                <h3 className="text-white font-bold text-lg drop-shadow-lg">
                  {image.title}
                </h3>
              )}
            </motion.div>
          </>
        ) : (
          <div className="flex aspect-square h-full items-center justify-center bg-secondary">
            <Sparkles size={32} className="mx-auto text-muted-foreground" />
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function GalleryGrid({ images }: { images: ImageRec[] }) {
  const [modal, setModal] = useState<ImageRec | null>(null)
  
  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 border rounded-lg bg-background">
        <div className="p-12 text-center max-w-md">
          <Sparkles size={48} className="mx-auto text-muted-foreground mb-6" />
          <h3 className="font-heading text-xl font-bold mb-3">
            Your Visual Journey Begins
          </h3>
          <p className="text-muted-foreground mb-6">
            Upload your first image to start creating an extraordinary gallery experience.
          </p>
          <Link
            href="/upload"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Sparkles size={18} />
            Start Creating
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {images.map((img) => (
            <GalleryItem key={img.id} image={img} onImageClick={() => setModal(img)} />
          ))}
        </Masonry>
      </motion.div>
      
      <AnimatePresence>
        {modal && modal.thumbUrl ? (
          <ImageModal
            src={modal.thumbUrl}
            title={modal.title ?? undefined}
            imageId={modal.id}
            onClose={() => setModal(null)}
          />
        ) : null}
      </AnimatePresence>
    </>
  )
}