'use server'

import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth-guard'

export async function createClient(data: {
  email: string
  password: string
  restaurantIds: string[]
  restaurantName?: string
}) {
  await requireSuperAdmin()
  const passwordHash = await bcrypt.hash(data.password, 10)

  const restaurantIds = [...data.restaurantIds]
  if (data.restaurantName) {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: data.restaurantName,
        slug: data.restaurantName.toLowerCase().replace(/\s+/g, '-'),
        defaultLocale: 'en',
      },
    })
    restaurantIds.push(restaurant.id)
  }

  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: 'RESTAURANT_ADMIN',
      restaurants: { connect: restaurantIds.map((id: string) => ({ id })) },
    },
  })
}

export async function updateClient(
  id: string,
  data: { email?: string; restaurantIds?: string[] }
) {
  await requireSuperAdmin()
  const { restaurantIds, ...rest } = data
  return prisma.user.update({
    where: { id },
    data: {
      ...rest,
      restaurants: restaurantIds
        ? { set: restaurantIds.map((id: string) => ({ id })) }
        : undefined,
    },
  })
}

export async function resetClientPassword(id: string, newPassword: string) {
  await requireSuperAdmin()
  const passwordHash = await bcrypt.hash(newPassword, 10)
  return prisma.user.update({
    where: { id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
  })
}
