import { cookies } from 'next/headers'
import { prisma } from './prisma'

export async function getSessionInfo(): Promise<{ userId: string | null; role: 'ADMIN' | 'EDITOR' | 'VIEWER' }> {
  const cookieStore = await cookies()
  const roleCookie = cookieStore.get('rbacRole')?.value
  const roleClient = cookieStore.get('rbacRoleClient')?.value
  const userCookie = cookieStore.get('rbacUsernameClient')?.value
  // Prefer elevated role from secure cookie; fall back to DB role otherwise
  let role: 'ADMIN' | 'EDITOR' | 'VIEWER' = (roleCookie === 'ADMIN' || roleCookie === 'EDITOR') ? (roleCookie as any) : 'VIEWER'
  // Dev fallback: if httpOnly role is missing but client role shows elevated, honor it in non-production.
  if (process.env.NODE_ENV !== 'production' && !(role === 'ADMIN' || role === 'EDITOR')) {
    if (roleClient === 'ADMIN' || roleClient === 'EDITOR') {
      role = roleClient as any
    }
  }
  let userId: string | null = null
  if (userCookie) {
    const u = await prisma.user.findUnique({ where: { username: userCookie }, select: { id: true, role: true } })
    if (u) {
      userId = u.id
      // Only downgrade if cookie didn't already grant ADMIN/EDITOR
      if (!(role === 'ADMIN' || role === 'EDITOR')) {
        role = u.role as any
      }
    }
  }
  return { userId, role }
}
