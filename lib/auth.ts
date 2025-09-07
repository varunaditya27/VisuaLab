import { prisma } from './prisma'

export type Role = 'ADMIN' | 'USER'

export async function getUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } })
}

export function canManageResource(role: Role, ownerId: string, userId?: string) {
  if (role === 'ADMIN') return true
  return !!userId && ownerId === userId
}
