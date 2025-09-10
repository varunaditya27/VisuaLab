"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { LinkButton } from '@/components/ui/LinkButton'

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
      className={`text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
    >
      {label}
    </Link>
  )
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<'ADMIN' | 'VIEWER'>('VIEWER')
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    // This is a simplified way to get user info client-side.
    // In a real app, this would likely come from a context or a session hook.
    const roleMatch = document.cookie.match(/(?:^|; )rbacRoleClient=([^;]+)/)
    const usernameMatch = document.cookie.match(/(?:^|; )rbacUsernameClient=([^;]+)/)
    
    if (roleMatch) setRole(decodeURIComponent(roleMatch[1]) === 'ADMIN' ? 'ADMIN' : 'VIEWER')
    if (usernameMatch) setUsername(decodeURIComponent(usernameMatch[1]))
  }, [])
  
  const promptLogin = (tab: 'login' | 'register' = 'login') => {
    window.dispatchEvent(new CustomEvent('visuauth:open', { detail: { tab } }))
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    location.reload()
  }

  return (
        </div>

        {/* Mobile Menu Button */}
        <Button
          className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus:ring-0 md:hidden !p-2 !bg-transparent !border-none"
          onClick={() => setOpen(o => !o)}
        >
          <motion.div animate={{ rotate: open ? 15 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Camera className="h-6 w-6" />
          </motion.div>
          <span className="sr-only">Toggle Menu</span>
        </Button>
        
        {/* Mobile Menu */}
        {open && (
          <div className="fixed inset-0 top-14 z-50 grid h-[calc(100vh-3.5rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 md:hidden">
            <div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md">
              <Link href="/" className="flex items-center space-x-2">
                <span className="font-bold">VisuaLab</span>
              </Link>
              <nav className="grid grid-flow-row auto-rows-max text-sm">
                {mainNav.map(item => (
                  <Link key={item.href} href={item.href} className="flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}

              <>
                {role === 'ADMIN' && (
                  <LinkButton href="/admin" className="!bg-transparent !border-none text-muted-foreground hover:text-white">
                    <Shield size={16} className="mr-2" /> Admin
                  </LinkButton>
                )}
                <span className="text-sm text-muted-foreground hidden sm:inline">@{username}</span>
                <Button onClick={handleLogout} className="!bg-transparent !border-none text-muted-foreground hover:text-white">
                  <LogOut size={16} className="mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => promptLogin('login')} className="!bg-transparent !border-none text-muted-foreground hover:text-white">
                  <LogIn size={16} className="mr-2" /> Login
                </Button>
                <Button onClick={() => promptLogin('register')}>
                  Sign Up
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}