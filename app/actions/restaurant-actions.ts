'use server'

import prisma from '@/lib/prisma'

export async function listRestaurants() {
  return prisma.restaurant.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function createRestaurant(data: {
  name: string
  slug: string
  email?: string
  phone?: string
  tagline?: string
  logoUrl?: string
  colorTheme?: string
  defaultLocale: 'en' | 'fr'
}) {
  return prisma.restaurant.create({ data })
}

export async function updateRestaurant(
  id: string,
  data: {
    name?: string
    slug?: string
    email?: string
    phone?: string
    tagline?: string
    logoUrl?: string
    colorTheme?: string
    defaultLocale?: 'en' | 'fr'
  }
) {
  return prisma.restaurant.update({ where: { id }, data })
}

export async function deleteRestaurant(id: string) {
  return prisma.restaurant.delete({ where: { id } })
}

export async function listRestaurantsForUser(userId: string) {
  return prisma.restaurant.findMany({
    where: { users: { some: { id: userId } } },
    orderBy: { createdAt: 'desc' },
  })
}
