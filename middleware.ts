import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const role = req.cookies.get('rbacRole')?.value || 'VIEWER'

  // Extend admin-only protection to /upload (unified upload page)
  const adminOnly = pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || pathname === '/upload'
  if (adminOnly && role !== 'ADMIN') {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('unauthorized', '1')
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/upload', '/api/upload/:path*']
}
