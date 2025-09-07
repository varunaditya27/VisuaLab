import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('rbacRole', '', { path: '/', maxAge: 0 })
  res.cookies.set('rbacRoleClient', '', { path: '/', maxAge: 0 })
  res.cookies.set('rbacUsernameClient', '', { path: '/', maxAge: 0 })
  return res
}
