'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function updateEmail(email: string) {
  const session = await auth()
  if (!session) {
    throw new Error('Not authenticated')
  }
  return prisma.user.update({
    where: { id: session.user.id },
    data: { email },
  })
}

export async function updatePassword(password: string) {
  const session = await auth()
  if (!session) {
    throw new Error('Not authenticated')
  }
  const passwordHash = await bcrypt.hash(password, 10)
  return prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  })
}
