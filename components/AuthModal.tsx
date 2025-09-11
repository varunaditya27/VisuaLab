"use client"

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Loader2 } from 'lucide-react'

type Tab = 'login' | 'register'

function AuthForm({ tab, loading }: { tab: Tab, loading: boolean }) {
  const variants = {
    hidden: (direction: number) => ({ opacity: 0, x: direction * 200 }),
    visible: { opacity: 1, x: 0 },
    exit: (direction: number) => ({ opacity: 0, x: direction * -200 })
  }
  const direction = tab === 'login' ? 1 : -1

  return (
    <motion.div
      key={tab}
      custom={direction}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <label htmlFor="username" className="text-sm font-medium text-muted-foreground">
          Username
        </label>
        <Input
          id="username"
          name="username"
          type="text"
          required
          placeholder="yourname"
          autoComplete="username"
          disabled={loading}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
          disabled={loading}
        />
      </div>
    </motion.div>
  )
}


export default function AuthModal() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { tab?: Tab } | undefined
      setTab(detail?.tab ?? 'login')
      setError(null)
      setOpen(true)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('visuauth:open', onOpen as EventListener)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('visuauth:open', onOpen as EventListener)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const form = e.currentTarget
      const formData = new FormData(form)
      const body = {
        username: String(formData.get('username') || ''),
        password: String(formData.get('password') || ''),
      }
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || 'Something went wrong')
        return
      }
      setOpen(false)
      setTimeout(() => {
        if (typeof window !== 'undefined') window.location.reload()
      }, 300)
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden
          />
          <motion.div
            className="relative z-[101] w-full max-w-sm rounded-2xl border bg-popover p-6 shadow-2xl"
            initial={{ y: 20, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            <div className="mb-6 flex flex-col text-center">
              <h2 id="auth-modal-title" className="font-heading text-2xl font-bold">
                {tab === 'login' ? 'Welcome Back' : 'Join VisuaLab'}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {tab === 'login' ? 'Sign in to access your gallery.' : 'Create an account to get started.'}
              </p>
            </div>
            
            <Button
              onClick={() => setOpen(false)}
              variant="ghost"
              className="absolute top-3 right-3 !h-8 !w-8 !p-0"
              aria-label="Close"
            >
              <X size={18} />
            </Button>

            <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
              <Button
                onClick={() => setTab('login')}
                variant={tab === 'login' ? 'primary' : 'ghost'}
                className="w-full"
              >
                Login
              </Button>
              <Button
                onClick={() => setTab('register')}
                variant={tab === 'register' ? 'primary' : 'ghost'}
                className="w-full"
              >
                Sign Up
              </Button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="overflow-hidden relative h-[160px]">
                <AnimatePresence initial={false} custom={tab} mode="popLayout">
                    <AuthForm tab={tab} loading={loading} />
                </AnimatePresence>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
                {loading ? (tab === 'login' ? 'Signing in…' : 'Creating…') : tab === 'login' ? 'Sign in' : 'Create account'}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
