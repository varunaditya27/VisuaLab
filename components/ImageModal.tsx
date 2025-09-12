'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Share2, Heart, ZoomIn, ZoomOut, RotateCw, Maximize, MessageCircle, Send, LogIn, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LinkButton } from '@/components/ui/LinkButton'
import { scaleIn } from '@/lib/animations'

interface ImageModalProps {
  src: string
  title?: string
  onClose: () => void
  imageId?: string
}

type ImageFormats = {
  thumb?: { jpg: string | null; webp: string | null; avif: string | null }
  responsive?: Array<{ width: number; jpg: string | null; webp: string | null; avif: string | null }>
  originalUrl?: string | null
}

export default function ImageModal({ src, title, onClose, imageId }: ImageModalProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [likeState, setLikeState] = useState<{ count: number; likedByMe: boolean } | null>(null)
  const [comments, setComments] = useState<Array<{ id: string; content: string; createdAt: string; user?: { id: string; username?: string } }>>([])
  const [commentDraft, setCommentDraft] = useState('')
  const [formats, setFormats] = useState<ImageFormats | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const incrementedRef = useRef<string | null>(null)
  
  useEffect(() => {
    const update = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setContainerWidth(Math.max(320, Math.floor(rect.width)))
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      ro.disconnect()
    }
  }, [])
  
  const [viewer, setViewer] = useState<{ id?: string; username?: string } | null>(null)
  useEffect(() => {
    const usernameMatch = document.cookie.match(/(?:^|; )rbacUsernameClient=([^;]+)/)
    if (usernameMatch) setViewer({ username: decodeURIComponent(usernameMatch[1]) })
  }, [])
  const loggedIn = !!viewer

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = 'auto'
    }
  }, [onClose])

  useEffect(() => {
    if (!imageId) return
    let isCancelled = false

    const fetchData = async () => {
      try {
        const [likesRes, commRes, imgRes] = await Promise.all([
          fetch(`/api/likes?imageId=${imageId}`),
          fetch(`/api/comments?imageId=${imageId}`),
          fetch(`/api/images?imageId=${imageId}`)
        ])
        if (isCancelled) return
        if (likesRes.ok) setLikeState(await likesRes.json())
        if (commRes.ok) {
          const data = await commRes.json()
          setComments(data.comments || [])
        }
        if (imgRes.ok) {
          const data = await imgRes.json()
          const rec = data.images?.[0]
          if (rec) {
            setFormats({ thumb: rec.thumb, responsive: rec.responsive, originalUrl: rec.originalUrl })
          }
        }
      } catch (err) {
        if (!isCancelled) console.error("Failed to fetch image metadata", err)
      }
    }

    fetchData()

    // Guard against duplicate increments within the same client session/mount
    if (incrementedRef.current !== imageId) {
      incrementedRef.current = imageId
      fetch('/api/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageId }) }).catch(() => {})
    }

    return () => { isCancelled = true }
  }, [imageId])

  // Ensure every new image opens reset and not zoomed in
  useEffect(() => {
    setScale(1)
    setRotation(0)
    setIsLoaded(false)
  }, [imageId])

  const promptLogin = (tab: 'login' | 'register' = 'login') => {
    window.dispatchEvent(new CustomEvent('visuauth:open', { detail: { tab } }))
  }

  const resetTransform = () => {
    setScale(1)
    setRotation(0)
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const draft = commentDraft.trim()
    if (!draft || !imageId || !loggedIn) return
    
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
        const fresh = await fetch(`/api/comments?imageId=${imageId}`).then(r => r.json())
        if (fresh?.comments) setComments(fresh.comments)
      }
    } catch (err) {
      console.error("Failed to submit comment", err)
    }
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <motion.div 
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
          onClick={onClose} 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        
        <motion.div 
          className="relative w-full h-full flex flex-col gap-4"
          variants={scaleIn}
        >
          {/* Header */}
          <header className="relative z-10 flex items-center justify-between gap-4 p-2 rounded-lg bg-card/80 border border-white/10 backdrop-blur-sm">
            <h2 className="font-heading text-lg font-bold truncate">{title || 'Image'}</h2>
            <div className="flex items-center gap-1">
              <Button className="!p-2 !bg-transparent !border-none !text-primary" onClick={() => setScale(s => s * 1.2)} title="Zoom In"><ZoomIn size={18} /></Button>
              <Button className="!p-2 !bg-transparent !border-none !text-primary" onClick={() => setScale(s => s / 1.2)} title="Zoom Out"><ZoomOut size={18} /></Button>
              <Button className="!p-2 !bg-transparent !border-none !text-primary" onClick={() => setRotation(r => r + 90)} title="Rotate"><RotateCw size={18} /></Button>
              <Button className="!p-2 !bg-transparent !border-none !text-primary" onClick={resetTransform} title="Reset"><Maximize size={18} /></Button>
              <Button className="!p-2 !bg-transparent !border-none !text-primary" onClick={onClose} title="Close"><X size={18} /></Button>
            </div>
          </header>

          {/* Main Content */}
          <main ref={containerRef} className="relative flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-card border">
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              </div>
            )}
            <div className="relative max-w-[92vw] max-h-[82vh] w-full h-full flex items-center justify-center">
              <motion.picture
                style={{ scale, rotate: rotation }}
                drag
                dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }}
                dragTransition={{ bounceStiffness: 100, bounceDamping: 20 }}
                className="w-full h-full flex items-center justify-center"
              >
                {/* Build full srcset across formats if available */}
                {formats?.responsive?.length ? (
                  (() => {
                    const sorted = [...formats.responsive!].sort((a, b) => a.width - b.width)
                    const avifSet = sorted.filter(r => r.avif).map(r => `${r.avif} ${r.width}w`).join(', ')
                    const webpSet = sorted.filter(r => r.webp).map(r => `${r.webp} ${r.width}w`).join(', ')
                    const jpgSet = sorted.filter(r => r.jpg).map(r => `${r.jpg} ${r.width}w`).join(', ')
                    const fallback = sorted[sorted.length - 1]
                    return (
                      <>
                        {avifSet ? <source srcSet={avifSet} sizes={`${containerWidth || 1200}px`} type="image/avif" /> : null}
                        {webpSet ? <source srcSet={webpSet} sizes={`${containerWidth || 1200}px`} type="image/webp" /> : null}
                        <img
                          src={fallback.jpg || src}
                          srcSet={jpgSet || undefined}
                          sizes={`${containerWidth || 1200}px`}
                          alt={title || 'Modal image'}
                          className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
                          onLoad={() => setIsLoaded(true)}
                          decoding="async"
                          loading="eager"
                        />
                      </>
                    )
                  })()
                ) : (
                  <img
                    src={src}
                    alt={title || 'Modal image'}
                    className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
                    onLoad={() => setIsLoaded(true)}
                    decoding="async"
                    loading="eager"
                  />
                )}
              </motion.picture>
            </div>
          </main>

          {/* Footer & Comments */}
          <footer className="relative z-10 flex flex-col lg:flex-row gap-4 items-start">
            <div className="w-full lg:w-2/3 bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2"><MessageCircle size={18} /> Comments</h3>
                <span className="text-sm text-muted-foreground">{comments.length}</span>
              </div>
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                {comments.length > 0 ? comments.map(c => (
                  <div key={c.id} className="text-sm">
                    <p className="font-semibold">{c.user?.username ?? 'Anonymous'}</p>
                    <p className="text-muted-foreground">{c.content}</p>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
                )}
              </div>
              <form className="mt-4 flex items-center gap-2" onSubmit={handleCommentSubmit}>
 
                <input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder={loggedIn ? 'Add a comment...' : 'Please log in to comment'}
                  className="input flex-1"
                  disabled={!loggedIn}
                />
                <Button className="!p-2.5" type="submit" disabled={!loggedIn || !commentDraft.trim()}>
                  <Send size={16} />
                </Button>
              </form>
            </div>
            <div className="w-full lg:w-1/3 bg-card border rounded-lg p-4 flex flex-col gap-2">
              <Button
                className={`w-full justify-start ${likeState?.likedByMe ? '' : '!bg-transparent !border-primary/50 !text-primary'}`}
                onClick={async () => {
                  if (!imageId || !loggedIn) return promptLogin();
                  try {
                    const res = await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageId }) })
                    if (res.ok) setLikeState(await res.json())
                  } catch {}
                }}
              >
                <Heart size={16} className="mr-2" />
                <span>{likeState?.likedByMe ? 'Liked' : 'Like'} ({likeState?.count ?? 0})</span>
              </Button>
              <Button className="w-full justify-start !bg-transparent !border-primary/50 !text-primary">
                <Share2 size={16} className="mr-2" />
                Share
              </Button>
              <LinkButton href={`/api/images/original/${imageId}`} download className="w-full justify-start !bg-transparent !border-primary/50 !text-primary">
                <Download size={16} className="mr-2" />
                Download
              </LinkButton>
            </div>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}