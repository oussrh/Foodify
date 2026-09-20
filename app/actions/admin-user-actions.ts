'use server'

import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth-guard'

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
