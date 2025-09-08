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
        'nav-item inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-300 magnetic',
        'group hover:scale-105 hover:shadow-xl',
        isActive 
          ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-xl' 
          : 'text-gray-700 hover:text-blue-500 hover:bg-white/20 backdrop-blur-sm',
      ].join(' ')}
    >
      <Icon size={18} className="transition-transform duration-300 group-hover:rotate-12" /> 
      <span className="hidden sm:inline">{label}</span>
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
    <header className="sticky top-0 z-50 glass border-b border-white/20 backdrop-blur-heavy">
      <div className="container flex h-20 items-center justify-between">
        {/* Revolutionary Logo */}
        <Link href="/" className="group flex items-center gap-3 transition-transform duration-300 hover:scale-105">
          <div className="relative">
            <div className="rounded-2xl bg-aurora-primary p-3 text-white shadow-aurora-glow animate-float group-hover:animate-glow-pulse">
              <Camera size={24} className="transition-transform duration-300 group-hover:rotate-12" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-aurora-primary opacity-20 blur-md animate-glow-pulse"></div>
          </div>
          <span className="font-display text-2xl font-bold text-holographic">
            VisuaLab
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-3 md:flex">
          <NavLink href="/" label="Gallery" icon={GalleryHorizontal} />
          <NavLink href="/albums" label="Albums" icon={FolderOpen} />
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {role === 'ADMIN' && (
            <>
              <Link href="/upload" className="btn-holo primary group">
                <Upload size={18} className="transition-transform duration-300 group-hover:scale-110" /> 
                <span>Upload</span>
              </Link>
              <Link href="/admin" className="btn-holo secondary group">
                <Shield size={18} className="transition-transform duration-300 group-hover:rotate-12" /> 
                <span>Admin</span>
              </Link>
            </>
          )}
          
          {username ? (
            <div className="flex items-center gap-3">
              <div className="glass-strong rounded-2xl px-4 py-2.5 transition-all duration-300 hover:shadow-aurora-glow">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-electric-blue">@</span>
                  <span className="font-mono font-medium text-gray-700">{username}</span>
                  <span className="rounded-full bg-aurora-primary px-2 py-0.5 text-xs text-white font-medium animate-glow-pulse">
                    {role}
                  </span>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="btn-holo ghost group"
              >
                <LogOut size={18} className="transition-transform duration-300 group-hover:scale-110" /> 
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setAuthInitialTab('login'); setAuthOpen(true) }} 
                className="btn-holo ghost group"
              >
                <LogIn size={18} className="transition-transform duration-300 group-hover:scale-110" /> 
                <span>Login</span>
              </button>
              <button 
                onClick={() => { setAuthInitialTab('register'); setAuthOpen(true) }} 
                className="btn-holo primary group"
              >
                <span>Join Lab</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          aria-label="Toggle menu"
          className="md:hidden btn-holo ghost p-3"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Panel */}
      {open && (
        <div className="md:hidden glass-strong border-t border-white/20">
          <div className="container flex flex-col gap-3 py-6">
            <NavLink href="/" label="Gallery" icon={GalleryHorizontal} />
            <NavLink href="/albums" label="Albums" icon={FolderOpen} />
            
            {role === 'ADMIN' && (
              <>
                <Link href="/upload" className="btn-holo primary">
                  <Upload size={18} /> Upload
                </Link>
                <Link href="/admin" className="btn-holo secondary">
                  <Shield size={18} /> Admin
                </Link>
              </>
            )}
            
            {username ? (
              <div className="flex flex-col gap-3">
                <div className="glass-strong rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-electric-blue">@</span>
                    <span className="font-mono font-medium text-gray-700">{username}</span>
                    <span className="rounded-full bg-aurora-primary px-2 py-1 text-xs text-white font-medium">
                      {role}
                    </span>
                  </div>
                </div>
                <button onClick={handleLogout} className="btn-holo ghost justify-start">
                  <LogOut size={18} /> Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button onClick={() => { setAuthInitialTab('login'); setAuthOpen(true) }} className="btn-holo ghost justify-start">
                  <LogIn size={18} /> Login
                </button>
                <button onClick={() => { setAuthInitialTab('register'); setAuthOpen(true) }} className="btn-holo primary justify-start">
                  Join Lab
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revolutionary Auth Modal */}
      {authOpen && (
        <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-void-black/60 backdrop-blur-sm p-4" onMouseDown={() => setAuthOpen(false)}>
          <div 
            className="card-quantum w-full max-w-md my-auto p-8 animate-cosmic-entrance" 
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-holographic">
                Welcome to the Lab
              </h2>
              <button 
                onClick={() => setAuthOpen(false)} 
                className="btn-holo ghost p-2"
              >
                <X size={20} />
              </button>
            </div>
            
            <AuthTabs initialTab={authInitialTab} onLogin={handleLogin} onRegister={handleRegister} />
            
            <div className="mt-6 border-t border-white/20 pt-6">
              <p className="text-center text-xs text-gray-500 mb-3">✨ Demo Admin Portal:</p>
              <div className="glass-subtle rounded-xl p-4 text-center text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Username:</span>
                  <span className="font-mono font-medium text-electric-blue">CloneFest2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Password:</span>
                  <span className="font-mono font-medium text-neon-pink">CloneFest2025</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function AuthForm({ onSubmit, cta = 'Enter Lab' }: { onSubmit: (u: string, p: string) => Promise<{ ok: boolean; message?: string }>; cta?: string }) {
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
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-neural w-full"
          placeholder="Enter your username"
          autoComplete="username"
          required
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-neural w-full"
          placeholder="Enter your password"
          autoComplete={cta === 'Join Lab' ? 'new-password' : 'current-password'}
          required
        />
      </div>
      {error && (
        <div className="glass-subtle rounded-xl p-3 border border-red-300">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <button 
        disabled={loading} 
        className="btn-holo primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? `${cta}...` : cta}
      </button>
    </form>
  )
}

function AuthTabs({ initialTab = 'login', onLogin, onRegister }: { 
  initialTab?: 'login' | 'register'; 
  onLogin: (u: string, p: string) => Promise<{ ok: boolean; message?: string }>; 
  onRegister: (u: string, p: string) => Promise<{ ok: boolean; message?: string }> 
}) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab)
  
  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-2 glass-subtle rounded-2xl p-2">
        <button 
          onClick={() => setTab('login')} 
          className={`rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
            tab === 'login' 
              ? 'bg-aurora-primary text-white shadow-aurora-glow' 
              : 'text-gray-600 hover:text-electric-blue hover:bg-white/20'
          }`}
        >
          Sign In
        </button>
        <button 
          onClick={() => setTab('register')} 
          className={`rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
            tab === 'register' 
              ? 'bg-aurora-primary text-white shadow-aurora-glow' 
              : 'text-gray-600 hover:text-electric-blue hover:bg-white/20'
          }`}
        >
          Join Lab
        </button>
      </div>
      
      {tab === 'login' ? (
        <AuthForm onSubmit={onLogin} cta="Enter Lab" />
      ) : (
        <AuthForm onSubmit={onRegister} cta="Join Lab" />
      )}
    </div>
  )
}
