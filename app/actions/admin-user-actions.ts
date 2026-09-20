'use server'

import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { password, uuid } from '@/lib/schemas/common'
import { adminInput, adminPatch, type AdminInput, type AdminPatch } from '@/lib/schemas/user'

export async function createAdmin(raw: AdminInput) {
  await requireSuperAdmin()
  const data = adminInput.parse(raw)
  const passwordHash = await bcrypt.hash(data.password, 10)
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  })
}

export async function updateAdmin(rawId: string, raw: AdminPatch) {
  await requireSuperAdmin()
  const id = uuid.parse(rawId)
  const data = adminPatch.parse(raw)
  return prisma.user.update({
    where: { id },
    data,
  })
}

export async function resetAdminPassword(rawId: string, newPassword: string) {
  await requireSuperAdmin()
  const id = uuid.parse(rawId)
  const passwordHash = await bcrypt.hash(password.parse(newPassword), 10)
  return prisma.user.update({
    where: { id },
    data: { 
      passwordHash, 
      passwordResetToken: 'FORCE_CHANGE', // This will force password change on next login
      passwordResetExpires: null 
    },
  })
}
