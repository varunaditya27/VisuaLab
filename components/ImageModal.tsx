'use client'

import { useEffect, useMemo, useState } from 'react'
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

export default function ImageModal({ src, title, onClose, imageId }: ImageModalProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [likeState, setLikeState] = useState<{ count: number; likedByMe: boolean } | null>(null)
  const [comments, setComments] = useState<Array<{ id: string; content: string; createdAt: string; user?: { id: string; username?: string } }>>([])
  const [commentDraft, setCommentDraft] = useState('')
  
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
        const [likesRes, commRes] = await Promise.all([
          fetch(`/api/likes?imageId=${imageId}`),
          fetch(`/api/comments?imageId=${imageId}`)
        ])
        if (isCancelled) return
        if (likesRes.ok) setLikeState(await likesRes.json())
        if (commRes.ok) {
          const data = await commRes.json()
          setComments(data.comments || [])
        }
      } catch (err) {
        if (!isCancelled) console.error("Failed to fetch image metadata", err)
      }
    }
    
    fetchData()
    fetch('/api/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageId }) }).catch(() => {})
    
    return () => { isCancelled = true }
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
              <Button className="!p-2 !bg-transparent !border-none" onClick={() => setScale(s => s * 1.2)} title="Zoom In"><ZoomIn size={18} /></Button>
              <Button className="!p-2 !bg-transparent !border-none" onClick={() => setScale(s => s / 1.2)} title="Zoom Out"><ZoomOut size={18} /></Button>
              <Button className="!p-2 !bg-transparent !border-none" onClick={() => setRotation(r => r + 90)} title="Rotate"><RotateCw size={18} /></Button>
              <Button className="!p-2 !bg-transparent !border-none" onClick={resetTransform} title="Reset"><Maximize size={18} /></Button>
              <Button className="!p-2 !bg-transparent !border-none" onClick={onClose} title="Close"><X size={18} /></Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="relative flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-card border">
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              </div>
            )}
            <motion.img
              src={src}
              alt={title || "Modal image"}
              className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
              onLoad={() => setIsLoaded(true)}
              style={{
                scale,
                rotate: rotation,
              }}
              drag
              dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }}
              dragTransition={{ bounceStiffness: 100, bounceDamping: 20 }}
            />
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
                className={`w-full justify-start ${likeState?.likedByMe ? '' : '!bg-transparent !border-purple-500/50'}`}
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
              <Button className="w-full justify-start !bg-transparent !border-purple-500/50">
                <Share2 size={16} className="mr-2" />
                Share
              </Button>
              <LinkButton href={`/api/images/original/${imageId}`} download className="w-full justify-start !bg-transparent !border-purple-500/50">
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