"use client"

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

type Tab = 'login' | 'register'

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
      // Close and refresh to reflect new cookies/role
      setOpen(false)
      // Small delay to allow modal exit animation
      setTimeout(() => {
        if (typeof window !== 'undefined') window.location.reload()
      }, 150)
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
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <motion.div
            className="relative z-[101] w-full max-w-sm rounded-xl border bg-background p-6 shadow-2xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="auth-modal-title" className="text-lg font-semibold">
                {tab === 'login' ? 'Sign in' : 'Create account'}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <Button
                onClick={() => setTab('login')}
                className={
                  tab === 'login'
                    ? 'w-full'
                    : 'w-full !bg-transparent !border-purple-500/50 text-muted-foreground'
                }
              >
                Login
              </Button>
              <Button
                onClick={() => setTab('register')}
                className={
                  tab === 'register'
                    ? 'w-full'
                    : 'w-full !bg-transparent !border-purple-500/50 text-muted-foreground'
                }
              >
                Sign Up
              </Button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="username" className="text-sm text-muted-foreground">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/40"
                  placeholder="yourname"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="password" className="text-sm text-muted-foreground">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/40"
                  placeholder="••••••••"
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                />
              </div>

              {error && (
                <p className="text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (tab === 'login' ? 'Signing in…' : 'Creating…') : tab === 'login' ? 'Sign in' : 'Create account'}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
