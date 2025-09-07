"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Camera, GalleryHorizontal, Upload, Menu, X, FolderOpen } from 'lucide-react'
import { useState } from 'react'

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

        <div className="hidden md:block">
          <Link href="/upload" className="btn-primary inline-flex items-center gap-1">
            <Upload size={16} /> Upload
          </Link>
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
            <Link href="/upload" className="btn-primary inline-flex items-center gap-1">
              <Upload size={16} /> Upload
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
