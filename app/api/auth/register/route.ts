import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any))
  const { username, password } = body as { username?: string; password?: string }
  if (!username || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) return NextResponse.json({ error: 'Username exists' }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({ data: { username, passwordHash, role: 'VIEWER' } })

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
  res.cookies.set('rbacUsernameClient', username, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
