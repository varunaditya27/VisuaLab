"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, GalleryHorizontal, FolderOpen, LogIn, LogOut, Shield, User, Menu, X, ChevronDown } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { LinkButton } from '@/components/ui/LinkButton'
import useClickOutside from '@/hooks/useClickOutside'

const mainNav = [
  { href: '/gallery', label: 'Gallery', icon: GalleryHorizontal },
  { href: '/albums', label: 'Albums', icon: FolderOpen },
]

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
  
  return (
    <Link
      href={href}
      className={`relative text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
    >
      <motion.span
        whileHover={{ y: -2 }}
        className="inline-block"
      >
        {label}
      </motion.span>
      {isActive && (
        <motion.div
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
          layoutId="underline"
          initial={false}
          animate={{ opacity: 1 }}
        />
      )}
    </Link>
  )
}

function UserNav({ username, role }: { username: string | null, role: 'ADMIN' | 'VIEWER' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useClickOutside<HTMLDivElement>(() => setMenuOpen(false)) as React.RefObject<HTMLDivElement | null>

  const promptLogin = (tab: 'login' | 'register' = 'login') => {
    window.dispatchEvent(new CustomEvent('visuauth:open', { detail: { tab } }))
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    location.reload()
  }

  if (!username) {
    return (
      <div className="flex items-center space-x-2">
        <Button variant="ghost" onClick={() => promptLogin('login')}>
          <LogIn size={16} className="mr-2" /> Login
        </Button>
        <Button onClick={() => promptLogin('register')}>
          Sign Up
        </Button>
      </div>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <motion.button 
        className="flex items-center gap-2 rounded-full p-2 transition-colors hover:bg-accent"
        onClick={() => setMenuOpen(!menuOpen)}
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <User size={16} className="text-secondary-foreground" />
        </div>
        <span className="text-sm font-medium hidden sm:inline">{username}</span>
        <ChevronDown size={16} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
      </motion.button>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-md bg-popover p-2 shadow-lg ring-1 ring-border focus:outline-none"
          >
            <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut size={16} className="mr-2" /> Logout
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [role, setRole] = useState<'ADMIN' | 'VIEWER'>('VIEWER')
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    const roleMatch = document.cookie.match(/(?:^|; )rbacRoleClient=([^;]+)/)
    const usernameMatch = document.cookie.match(/(?:^|; )rbacUsernameClient=([^;]+)/)
    
    if (roleMatch) setRole(decodeURIComponent(roleMatch[1]) === 'ADMIN' ? 'ADMIN' : 'VIEWER')
    if (usernameMatch) setUsername(decodeURIComponent(usernameMatch[1]))
  }, [])
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container relative flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <motion.div whileHover={{ rotate: -15, scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Camera className="h-6 w-6" />
            </motion.div>
            <span className="hidden font-bold sm:inline-block">VisuaLab</span>
          </Link>
        </div>

        {/* Centered Main Navigation (desktop) */}
        <nav className="pointer-events-auto absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex items-center space-x-6 text-sm font-medium">
          {mainNav.map(item => <NavLink key={item.href} {...item} />)}
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex flex-1 items-center justify-start md:hidden">
          <Button
            variant="ghost"
            className="p-2"
            onClick={() => setMobileMenuOpen(o => !o)}
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={mobileMenuOpen ? "x" : "menu"}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.div>
            </AnimatePresence>
            <span className="sr-only">Toggle Menu</span>
          </Button>
          {/* Mobile: Admin Panel quick access */}
          {role === 'ADMIN' && (
            <Link href="/admin" className="ml-2 inline-flex items-center rounded-md border border-primary/50 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 md:hidden">
              <Shield size={16} className="mr-2" /> Admin
            </Link>
          )}
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 top-16 z-40 md:hidden"
            >
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
              <div className="relative z-20 grid gap-6 rounded-md bg-popover p-6 text-popover-foreground shadow-lg">
                <Link href="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
                  <Camera />
                  <span className="font-bold">VisuaLab</span>
                </Link>
                <nav className="grid grid-flow-row auto-rows-max text-sm">
                  {mainNav.map(item => (
                    <Link key={item.href} href={item.href} className="flex w-full items-center rounded-md p-2 text-base font-medium hover:underline" onClick={() => setMobileMenuOpen(false)}>
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-1 items-center justify-end">
          {/* Desktop: Admin Panel quick access */}
          {role === 'ADMIN' && (
            <LinkButton href="/admin" className="mr-2 hidden md:inline-flex !bg-transparent !border-primary/50 !text-primary">
              <Shield size={16} className="mr-2" /> Admin Panel
            </LinkButton>
          )}
          <UserNav username={username} role={role} />
        </div>
      </div>
    </header>
  )
}