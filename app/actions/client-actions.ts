'use server'

import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function listClients(search?: string) {
  return prisma.user.findMany({
    where: {
      role: 'RESTAURANT_ADMIN',
      email: search ? { contains: search } : undefined,
    },
    include: { restaurants: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createClient(data: {
  email: string
  password: string
  restaurantIds: string[]
  restaurantName?: string
}) {
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

export async function deleteClient(id: string) {
  return prisma.user.delete({ where: { id } })
}

export async function resetClientPassword(id: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 10)
  return prisma.user.update({
    where: { id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
  })
}
