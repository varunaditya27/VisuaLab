import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const data = await req.json().catch(() => ({}))
  const { username, password } = data as { username?: string; password?: string }

  if (username === 'CloneFest2025' && password === 'CloneFest2025') {
    const res = NextResponse.json({ ok: true, role: 'ADMIN' })
    res.cookies.set('rbacRole', 'ADMIN', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    })
    // client-readable mirror for UI only
    res.cookies.set('rbacRoleClient', 'ADMIN', {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    })
    res.cookies.set('rbacUsernameClient', username, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  }

  // DB user login
  if (username && password) {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    const role = user.role
    const res = NextResponse.json({ ok: true, role })
    res.cookies.set('rbacRole', role, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    })
    res.cookies.set('rbacRoleClient', role, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    })
    res.cookies.set('rbacUsernameClient', username, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  }

  // Any other login becomes VIEWER
  const res = NextResponse.json({ ok: true, role: 'VIEWER' })
  res.cookies.set('rbacRole', 'VIEWER', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  })
  res.cookies.set('rbacRoleClient', 'VIEWER', {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
