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
  restaurantIds?: string[]
  restaurantName?: string
}) {
  const passwordHash = await bcrypt.hash(data.password, 10)

  const connectIds: string[] = []
  if (data.restaurantName) {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: data.restaurantName,
        slug: data.restaurantName.toLowerCase().replace(/\s+/g, '-'),
        defaultLocale: 'en',
      },
    })
    connectIds.push(restaurant.id)
  }
  if (data.restaurantIds && data.restaurantIds.length > 0) {
    connectIds.push(...data.restaurantIds)
  }

  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: 'RESTAURANT_ADMIN',
      restaurants: connectIds.length
        ? { connect: connectIds.map((id) => ({ id })) }
        : undefined,
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
        ? {
            set: [],
            connect: restaurantIds.map((rid) => ({ id: rid })),
          }
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
