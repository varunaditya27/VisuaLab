"use client"

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Eye, Heart, Download, Share2, Sparkles } from 'lucide-react'

type ImageRec = {
  id: string
  title?: string | null
  thumbUrl?: string | null
}

export function GalleryGrid({ images }: { images: ImageRec[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.08, 
        delayChildren: 0.1,
        ease: [0.23, 1, 0.32, 1]
      },
    },
  }
  
  const item = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.9,
      filter: 'blur(10px)'
    },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: { 
        duration: 0.6, 
        ease: [0.23, 1, 0.32, 1]
      }
    },
  }

  const hoverVariants = {
    hover: {
      scale: 1.05,
      rotate: 2,
      transition: {
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  }

  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="card-quantum p-12 text-center max-w-md">
          <div className="mb-6">
            <Sparkles size={48} className="mx-auto text-electric-blue animate-glow-pulse" />
          </div>
          <h3 className="font-heading text-xl font-bold text-holographic mb-3">
            Your Visual Journey Begins
          </h3>
          <p className="text-gray-600 mb-6">
            Upload your first image to start creating an extraordinary gallery experience.
          </p>
          <motion.a
            href="/upload"
            className="btn-holo primary inline-flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles size={18} />
            Start Creating
          </motion.a>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="galaxy-grid"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {images.map((img, index) => {
        const src = img.thumbUrl ?? null
        const isHovered = hoveredId === img.id
        
        return (
          <motion.div
            key={img.id}
            className="galaxy-grid-item card-quantum group"
            variants={item}
            whileHover="hover"
            onHoverStart={() => setHoveredId(img.id)}
            onHoverEnd={() => setHoveredId(null)}
            style={{
              // Add staggered delay for aurora effect
              animationDelay: `${index * 0.1}s`
            }}
          >
            <motion.div 
              className="relative aspect-square overflow-hidden"
              variants={hoverVariants}
            >
              {src ? (
                <>
                  {/* Main Image */}
                  <motion.img 
                    src={src} 
                    alt={img.title ?? 'Gallery image'} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    initial={{ scale: 1.1, filter: 'blur(20px)' }}
                    animate={{ scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                  />
                  
                  {/* Holographic Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-void-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Interactive Elements */}
                  <motion.div 
                    className="absolute inset-0 flex items-end justify-between p-4 opacity-0 group-hover:opacity-100"
                    initial={{ y: 20, opacity: 0 }}
                    whileHover={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    {/* Title */}
                    <div className="flex-1">
                      {img.title && (
                        <h3 className="text-white font-medium text-sm mb-2 text-glow">
                          {img.title}
                        </h3>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <motion.button
                        className="btn-holo ghost p-2"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        title="View"
                      >
                        <Eye size={16} />
                      </motion.button>
                      
                      <motion.button
                        className="btn-holo ghost p-2"
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        whileTap={{ scale: 0.95 }}
                        title="Like"
                      >
                        <Heart size={16} />
                      </motion.button>
                      
                      <motion.button
                        className="btn-holo ghost p-2"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        title="Share"
                      >
                        <Share2 size={16} />
                      </motion.button>
                    </div>
                  </motion.div>
                  
                  {/* Magnetic Field Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-0 pointer-events-none"
                    animate={isHovered ? {
                      opacity: [0, 0.5, 0],
                      scale: [1, 1.05, 1],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      background: 'radial-gradient(circle, rgba(0,212,255,0.2) 0%, transparent 70%)',
                    }}
                  />
                  
                  {/* Particle Trail Effect */}
                  {isHovered && (
                    <motion.div
                      className="absolute top-2 right-2 w-2 h-2 bg-electric-blue rounded-full"
                      animate={{
                        scale: [0, 1, 0],
                        x: [0, 10, 20],
                        y: [0, -5, -10],
                        opacity: [0, 1, 0],
                      }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-space-gray/20 to-void-black/10">
                  <div className="text-center">
                    <Sparkles size={32} className="mx-auto text-gray-400 mb-2 animate-pulse" />
                    <p className="text-xs text-gray-500">Processing...</p>
                  </div>
                </div>
              )}
            </motion.div>
            
            {/* Quantum Border Effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={isHovered ? {
                boxShadow: [
                  '0 0 0px rgba(0,212,255,0)',
                  '0 0 20px rgba(0,212,255,0.5)',
                  '0 0 0px rgba(0,212,255,0)',
                ],
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        )
      })}
      
      {/* Add some floating particles for ambiance */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-electric-blue/30 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
