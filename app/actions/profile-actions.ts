'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function updateEmail(email: string) {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }
  return prisma.user.update({
    where: { email: session.user.email },
    data: { email },
  })
}

export async function updatePassword(password: string) {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }
  const passwordHash = await bcrypt.hash(password, 10)
  return prisma.user.update({
    where: { email: session.user.email },
    data: { passwordHash },
  })
}
