import { cookies } from 'next/headers'
import { prisma } from './prisma'

export async function getSessionInfo(): Promise<{ userId: string | null; role: 'ADMIN' | 'EDITOR' | 'VIEWER' }> {
  const cookieStore = await cookies()
  const roleCookie = cookieStore.get('rbacRole')?.value
  const userCookie = cookieStore.get('rbacUsernameClient')?.value
  // Fix: correctly assign role for ADMIN and EDITOR
  let role: 'ADMIN' | 'EDITOR' | 'VIEWER' = (roleCookie === 'ADMIN' || roleCookie === 'EDITOR') ? roleCookie as 'ADMIN' | 'EDITOR' : 'VIEWER'
  let userId: string | null = null
  if (userCookie) {
    const u = await prisma.user.findUnique({ where: { username: userCookie }, select: { id: true, role: true } })
    if (u) {
      userId = u.id
      role = u.role as any
    }
  }
  return { userId, role }
}
