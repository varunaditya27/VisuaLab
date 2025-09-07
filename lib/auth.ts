import { cookies } from 'next/headers'
import { prisma } from './prisma'

export type Role = 'ADMIN' | 'VIEWER'

export async function getUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } })
}

export function canManageResource(role: Role, ownerId: string, userId?: string) {
  if (role === 'ADMIN') return true
  return !!userId && ownerId === userId
}

export function getRoleServer(): Role {
  const cookieStore = cookies()
  const role = cookieStore.get('rbacRole')?.value
  return (role === 'ADMIN' ? 'ADMIN' : 'VIEWER') as Role
}
