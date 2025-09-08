'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Share2, Heart, ZoomIn, ZoomOut, RotateCw, Maximize, MessageCircle, Send, LogIn } from 'lucide-react'

interface ImageModalProps {
  src: string
  title?: string
  onClose: () => void
  imageId?: string
}

export default function ImageModal({ src, title, onClose, imageId }: ImageModalProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [likeState, setLikeState] = useState<{ count: number; likedByMe: boolean } | null>(null)
  const [comments, setComments] = useState<Array<{ id: string; content: string; createdAt: string; user?: { id: string; username?: string } }>>([])
  const [commentDraft, setCommentDraft] = useState('')
  const role = useMemo(() => {
    if (typeof document === 'undefined') return 'VIEWER'
    const m = document.cookie.match(/(?:^|; )rbacRoleClient=([^;]+)/)
    return m && decodeURIComponent(m[1]) === 'ADMIN' ? 'ADMIN' : 'VIEWER'
  }, [])

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === '=') setScale(prev => Math.min(prev + 0.2, 3))
      if (e.key === '-') setScale(prev => Math.max(prev - 0.2, 0.5))
      if (e.key === 'r') setRotation(prev => prev + 90)
    }
    
    window.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    
    return () => {
      window.removeEventListener('keydown', onEsc)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  // Load like count and comments when imageId is provided
  useEffect(() => {
    if (!imageId) return
    ;(async () => {
      try {
        const [likesRes, commRes] = await Promise.all([
          fetch(`/api/likes?imageId=${imageId}`),
          fetch(`/api/comments?imageId=${imageId}`)
        ])
        if (likesRes.ok) setLikeState(await likesRes.json())
        if (commRes.ok) {
          const data = await commRes.json()
          setComments(data.comments || [])
        }
      } catch {}
    })()
  // Log a view (fire-and-forget)
  fetch('/api/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageId }) }).catch(() => {})
  }, [imageId])

  function promptLogin(tab: 'login' | 'register' = 'login') {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('visuauth:open', { detail: { tab } }))
  }

  const resetTransform = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  }

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      rotateX: -15,
      filter: 'blur(20px)'
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotateX: 0,
      filter: 'blur(0px)',
      transition: { 
        duration: 0.5, 
        ease: [0.23, 1, 0.32, 1],
        delay: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      rotateX: 15,
      filter: 'blur(10px)',
      transition: { duration: 0.3 }
    }
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Revolutionary Background */}
        <motion.div 
          className="absolute inset-0 bg-void-black/80 backdrop-blur-heavy"
          onClick={onClose}
        >
          {/* Particle Effects */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-electric-blue/40 rounded-full"
                animate={{
                  x: [0, Math.random() * 100, 0],
                  y: [0, Math.random() * 100, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </div>

          {/* Aurora Background Effect */}
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              background: [
                'radial-gradient(circle at 25% 25%, rgba(0,212,255,0.2) 0%, transparent 50%)',
                'radial-gradient(circle at 75% 75%, rgba(139,92,246,0.2) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 50%, rgba(244,113,181,0.2) 0%, transparent 50%)',
                'radial-gradient(circle at 25% 25%, rgba(0,212,255,0.2) 0%, transparent 50%)',
              ]
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </motion.div>

        {/* Modal Container */}
        <motion.div 
          className="relative max-w-[95vw] max-h-[95vh] flex flex-col"
          variants={modalVariants}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Controls */}
          <motion.div 
            className="flex items-center justify-between mb-4 glass-strong rounded-2xl px-6 py-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-electric-blue rounded-full animate-pulse"></div>
              <h3 className="font-heading font-medium text-white">
                {title || 'Visual Experience'}
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                className="btn-holo ghost p-2"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setScale(prev => Math.max(prev - 0.2, 0.5))}
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </motion.button>
              
              <motion.button
                className="btn-holo ghost p-2"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setScale(prev => Math.min(prev + 0.2, 3))}
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </motion.button>
              
              <motion.button
                className="btn-holo ghost p-2"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRotation(prev => prev + 90)}
                title="Rotate"
              >
                <RotateCw size={18} />
              </motion.button>
              
              <motion.button
                className="btn-holo ghost p-2"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetTransform}
                title="Reset View"
              >
                <Maximize size={18} />
              </motion.button>
              
              <motion.button
                className="btn-holo ghost p-2"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                title="Close"
              >
                <X size={18} />
              </motion.button>
            </div>
          </motion.div>

          {/* Image Container */}
          <motion.div 
            className="relative flex-1 flex items-center justify-center card-quantum p-4 min-h-[60vh]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {!isLoaded && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-12 h-12 border-2 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
              </motion.div>
            )}

            <motion.img
              src={src}
              alt={title || "Modal image"}
              className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
              onLoad={() => setIsLoaded(true)}
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.3s ease-out',
              }}
              drag
              onDragStart={() => setIsDragging(true)}
              onDragEnd={(_, info) => {
                setIsDragging(false)
                setPosition(prev => ({
                  x: prev.x + info.offset.x,
                  y: prev.y + info.offset.y
                }))
              }}
              whileHover={{ filter: 'brightness(1.05)' }}
            />

            {/* Image Glow Effect */}
            {isLoaded && (
              <motion.div
                className="absolute inset-4 pointer-events-none rounded-xl opacity-30"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(0,212,255,0.3)',
                    '0 0 40px rgba(139,92,246,0.3)',
                    '0 0 20px rgba(244,113,181,0.3)',
                    '0 0 20px rgba(0,212,255,0.3)',
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            )}
          </motion.div>

          {/* Footer Actions */}
          <motion.div 
            className="flex items-center justify-between mt-4 glass-strong rounded-2xl px-6 py-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                Scale: {Math.round(scale * 100)}% • Rotation: {rotation % 360}°
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                className="btn-holo ghost"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Like"
                onClick={async () => {
                  if (!imageId) return
                  // if not logged in (no username cookie), prompt login
                  const u = document.cookie.match(/(?:^|; )rbacUsernameClient=([^;]+)/)
                  if (!u) {
                    promptLogin('login')
                    return
                  }
                  try {
                    const res = await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageId }) })
                    if (res.ok) setLikeState(await res.json())
                  } catch {}
                }}
              >
                <div className={`inline-flex items-center gap-1 ${likeState?.likedByMe ? 'text-neon-pink' : ''}`}>
                  <Heart size={16} />
                  <span className="text-xs">{likeState?.count ?? 0}</span>
                </div>
              </motion.button>
              
              <motion.button
                className="btn-holo ghost"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Share"
              >
                <Share2 size={16} />
              </motion.button>
              
              <motion.button
                className="btn-holo primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Download"
              >
                <Download size={16} />
                <span>Download</span>
              </motion.button>
              
              {/* Comments trigger (scroll to comments) */}
              {imageId && (
                <a href="#image-modal-comments" className="btn-holo ghost" title="Comments">
                  <MessageCircle size={16} />
                </a>
              )}
            </div>
          </motion.div>
          
          {/* Comments Section */}
          {imageId && (
            <motion.div 
              id="image-modal-comments"
              className="mt-3 glass-subtle rounded-2xl px-6 py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-800 flex items-center gap-2"><MessageCircle size={16} /> Comments</h4>
                <span className="text-xs text-gray-500">{comments.length}</span>
              </div>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {comments.length === 0 && (
                  <div className="text-sm text-gray-500">No comments yet.</div>
                )}
                {comments.map(c => (
                  <div key={c.id} className="text-sm">
                    <span className="font-medium text-gray-800">{c.user?.username ?? 'User'}</span>
                    <span className="text-gray-500 ml-2">{new Date(c.createdAt).toLocaleString()}</span>
                    <p className="text-gray-700">{c.content}</p>
                  </div>
                ))}
              </div>
              <form
                className="mt-3 flex items-center gap-2"
                onSubmit={async (e) => {
                  e.preventDefault()
                  const draft = commentDraft.trim()
                  if (!draft) return
                  const u = document.cookie.match(/(?:^|; )rbacUsernameClient=([^;]+)/)
                  if (!u) {
                    promptLogin('login')
                    return
                  }
                  // fetch challenge and submit
                  try {
                    const chal = await fetch('/api/maptcha').then(r => r.json())
                    const answer = chal.a + chal.b
                    const res = await fetch('/api/comments', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ imageId, content: draft, a: chal.a, b: chal.b, issued: chal.issued, sig: chal.sig, answer })
                    })
                    if (res.ok) {
                      setCommentDraft('')
                      const fresh = await fetch(`/api/comments?imageId=${imageId}`).then(r => r.json()).catch(() => null)
                      if (fresh?.comments) setComments(fresh.comments)
                    }
                  } catch {}
                }}
              >
                <input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder={role === 'VIEWER' ? 'Write a comment (login required)' : 'Write a comment'}
                  className="input-neural flex-1"
                  maxLength={500}
                />
                <button className="btn-holo primary" type="submit">
                  <Send size={16} />
                </button>
                {!document.cookie.match(/(?:^|; )rbacUsernameClient=([^;]+)/) && (
                  <button type="button" className="btn-holo ghost" onClick={() => promptLogin('login')} title="Login">
                    <LogIn size={16} />
                  </button>
                )}
              </form>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
