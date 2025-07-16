'use server'

import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function listAdmins(search?: string) {
  return prisma.user.findMany({
    where: {
      role: 'SUPER_ADMIN',
      email: search ? { contains: search } : undefined,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createAdmin(data: { email: string; password: string }) {
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
  return prisma.user.update({
    where: { id },
    data,
  })
}

export async function deleteAdmin(id: string) {
  return prisma.user.delete({ where: { id } })
}

export async function resetAdminPassword(id: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 10)
  return prisma.user.update({
    where: { id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
  })
}
