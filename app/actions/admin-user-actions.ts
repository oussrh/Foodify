'use server'

import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth-guard'

export async function listAdmins(search?: string) {
  await requireSuperAdmin()
  return prisma.user.findMany({
    where: {
      role: 'SUPER_ADMIN',
      email: search ? { contains: search } : undefined,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createAdmin(data: { email: string; password: string }) {
  await requireSuperAdmin()
  const passwordHash = await bcrypt.hash(data.password, 10)
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  })
}

export async function updateAdmin(id: string, data: { email?: string }) {
  await requireSuperAdmin()
  return prisma.user.update({
    where: { id },
    data,
  })
}

export async function deleteAdmin(id: string) {
  const admin = await requireSuperAdmin()
  if (admin.id === id) throw new Error('You cannot delete your own account')
  return prisma.user.delete({ where: { id } })
}

export async function resetAdminPassword(id: string, newPassword: string) {
  await requireSuperAdmin()
  const passwordHash = await bcrypt.hash(newPassword, 10)
  return prisma.user.update({
    where: { id },
    data: { 
      passwordHash, 
      passwordResetToken: 'FORCE_CHANGE', // This will force password change on next login
      passwordResetExpires: null 
    },
  })
}
