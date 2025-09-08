import { cookies } from 'next/headers'
import { prisma } from './prisma'

export async function getSessionInfo(): Promise<{ userId: string | null; role: 'ADMIN' | 'VIEWER' }> {
  const cookieStore = await cookies()
  const roleCookie = cookieStore.get('rbacRole')?.value
  const userCookie = cookieStore.get('rbacUsernameClient')?.value
  let role: 'ADMIN' | 'VIEWER' = roleCookie === 'ADMIN' ? 'ADMIN' : 'VIEWER'
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
