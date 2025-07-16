'use server'

import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function listClients(search?: string) {
  return prisma.user.findMany({
    where: {
      role: 'RESTAURANT_ADMIN',
      email: search ? { contains: search } : undefined,
    },
    include: { restaurant: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createClient(data: {
  email: string
  password: string
  restaurantName?: string
}) {
  const passwordHash = await bcrypt.hash(data.password, 10)

  let restaurantId: string | undefined
  if (data.restaurantName) {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: data.restaurantName,
        slug: data.restaurantName.toLowerCase().replace(/\s+/g, '-'),
        defaultLocale: 'en',
      },
    })
    restaurantId = restaurant.id
  }

  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: 'RESTAURANT_ADMIN',
      restaurantId,
    },
  })
}

export async function updateClient(
  id: string,
  data: { email?: string; restaurantId?: string }
) {
  return prisma.user.update({ where: { id }, data })
}

export async function deleteClient(id: string) {
  return prisma.user.delete({ where: { id } })
}
