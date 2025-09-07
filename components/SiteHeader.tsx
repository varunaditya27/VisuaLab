"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Camera, GalleryHorizontal, Upload, Menu, X, FolderOpen, LogIn, LogOut, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  const pathname = usePathname()
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
  return (
    <Link
      href={href}
      className={[
        'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm transition-colors',
        isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:text-ink hover:bg-gray-50',
      ].join(' ')}
    >
      <Icon size={16} /> {label}
    </Link>
  )
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login')
  const [role, setRole] = useState<'ADMIN' | 'VIEWER'>('VIEWER')
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    // Read role and username from cookies on client
    const roleMatch = document.cookie.match(/(?:^|; )rbacRoleClient=([^;]+)/)
    const usernameMatch = document.cookie.match(/(?:^|; )rbacUsernameClient=([^;]+)/)
    
    if (roleMatch) setRole(decodeURIComponent(roleMatch[1]) === 'ADMIN' ? 'ADMIN' : 'VIEWER')
    if (usernameMatch) setUsername(decodeURIComponent(usernameMatch[1]))
  }, [])

  async function handleLogin(username: string, password: string): Promise<{ ok: boolean; message?: string }> {
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
      if (res.ok) {
        const data = await res.json()
        setRole(data.role === 'ADMIN' ? 'ADMIN' : 'VIEWER')
        setUsername(username)
        setAuthOpen(false)
        location.reload()
        return { ok: true }
      }
      let msg = 'Invalid credentials'
      try {
        const data = await res.json()
        msg = (data && (data.error || data.message)) || msg
      } catch {}
      return { ok: false, message: msg }
    } catch (e) {
      return { ok: false, message: 'Network error. Please try again.' }
    }
  }

  async function handleRegister(username: string, password: string): Promise<{ ok: boolean; message?: string }> {
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
      if (res.ok) {
        setRole('VIEWER')
        setUsername(username)
        setAuthOpen(false)
        location.reload()
        return { ok: true }
      }
      let msg = 'Registration failed'
      try {
        const data = await res.json()
        msg = (data && (data.error || data.message)) || msg
      } catch {}
      return { ok: false, message: msg }
    } catch (e) {
      return { ok: false, message: 'Network error. Please try again.' }
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAuthOpen(false)
    }
    if (authOpen) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [authOpen])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setRole('VIEWER')
    setUsername(null)
    location.reload()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="rounded-xl bg-brand-600 p-2 text-white shadow-glow animate-float">
            <Camera size={18} />
          </div>
          <span className="font-display text-xl">VisuaLab</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex">
          <NavLink href="/" label="Gallery" icon={GalleryHorizontal} />
          <NavLink href="/albums" label="Albums" icon={FolderOpen} />
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {role === 'ADMIN' && (
            <>
              <Link href="/upload" className="btn-primary inline-flex items-center gap-1">
                <Upload size={16} /> Upload
              </Link>
              <Link href="/admin" className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-brand-700 bg-brand-50">
                <Shield size={16} /> Admin
              </Link>
            </>
          )}
          
          {username ? (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2.5 py-1.5 text-sm text-brand-700">
                <span className="text-xs text-gray-500">@</span>
                <span className="font-medium">{username}</span>
                <span className="rounded bg-brand-100 px-1 py-0.5 text-xs">{role}</span>
              </div>
              <button onClick={handleLogout} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button onClick={() => { setAuthInitialTab('login'); setAuthOpen(true) }} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
                <LogIn size={16} /> Login
              </button>
              <button onClick={() => { setAuthInitialTab('register'); setAuthOpen(true) }} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-brand-700 hover:bg-brand-50">
                Register
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          aria-label="Toggle menu"
          className="md:hidden rounded-md p-2 text-gray-700 hover:bg-gray-100"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav panel */}
      {open && (
        <div className="md:hidden border-t border-white/50 bg-white/80 backdrop-blur">
          <div className="container flex flex-col gap-1 py-3">
            <NavLink href="/" label="Gallery" icon={GalleryHorizontal} />
            <NavLink href="/albums" label="Albums" icon={FolderOpen} />
            {role === 'ADMIN' && (
              <>
                <Link href="/upload" className="btn-primary inline-flex items-center gap-1">
                  <Upload size={16} /> Upload
                </Link>
                <Link href="/admin" className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-brand-700 bg-brand-50">
                  <Shield size={16} /> Admin
                </Link>
              </>
            )}
            {username ? (
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2.5 py-1.5 text-sm text-brand-700">
                  <span className="text-xs text-gray-500">@</span>
                  <span className="font-medium">{username}</span>
                  <span className="rounded bg-brand-100 px-1 py-0.5 text-xs">{role}</span>
                </div>
                <button onClick={handleLogout} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button onClick={() => { setAuthInitialTab('login'); setAuthOpen(true) }} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
                  <LogIn size={16} /> Login
                </button>
                <button onClick={() => { setAuthInitialTab('register'); setAuthOpen(true) }} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-brand-700 hover:bg-brand-50">
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {authOpen && (
        <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/40 p-4" onMouseDown={() => setAuthOpen(false)}>
          <div className="relative w-full max-w-sm my-auto rounded-xl border bg-white/95 p-6 shadow-xl backdrop-blur-sm" onMouseDown={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-gray-900">Welcome</h2>
              <button 
                onClick={() => setAuthOpen(false)} 
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
            <AuthTabs initialTab={authInitialTab} onLogin={handleLogin} onRegister={handleRegister} />
            <div className="mt-4 border-t border-gray-200 pt-4">
              <p className="text-center text-xs text-gray-500 mb-1">Demo Admin Account:</p>
              <div className="text-center text-xs text-gray-600 space-y-0.5">
                <div>Username: <span className="font-mono font-medium text-gray-800">CloneFest2025</span></div>
                <div>Password: <span className="font-mono font-medium text-gray-800">CloneFest2025</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function AuthForm({ onSubmit, cta = 'Sign in' }: { onSubmit: (u: string, p: string) => Promise<{ ok: boolean; message?: string }>; cta?: string }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await onSubmit(username, password)
    if (!res.ok) setError(res.message || 'Something went wrong')
    setLoading(false)
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-200"
          placeholder="Enter username"
          autoComplete="username"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-200"
          placeholder="Enter password"
          autoComplete={cta === 'Register' ? 'new-password' : 'current-password'}
          required
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">{loading ? `${cta}…` : cta}</button>
    </form>
  )
}

function AuthTabs({ initialTab = 'login', onLogin, onRegister }: { initialTab?: 'login' | 'register'; onLogin: (u: string, p: string) => Promise<{ ok: boolean; message?: string }>; onRegister: (u: string, p: string) => Promise<{ ok: boolean; message?: string }> }) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab)
  return (
    <div>
      <div className="mb-4 grid grid-cols-2 rounded-lg border bg-white/60 p-1 text-sm">
        <button onClick={() => setTab('login')} className={`rounded-md px-3 py-1.5 transition ${tab === 'login' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Login</button>
        <button onClick={() => setTab('register')} className={`rounded-md px-3 py-1.5 transition ${tab === 'register' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Register</button>
      </div>
      {tab === 'login' ? (
        <AuthForm onSubmit={onLogin} cta="Sign in" />
      ) : (
        <AuthForm onSubmit={onRegister} cta="Register" />
      )}
    </div>
  )
}
