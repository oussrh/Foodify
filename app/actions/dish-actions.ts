'use server'

import prisma from '@/lib/prisma'

export async function listDishes(restaurantId: string) {
  return prisma.dish.findMany({
    where: { restaurantId },
    include: { subcategory: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function createDish(
  restaurantId: string,
  data: {
    nameEn: string
    nameFr: string
    descriptionEn?: string
    descriptionFr?: string
    price: number
    imageUrl: string
    usdzUrl: string
    glbUrl: string
    subcategoryId?: string | null
  }
) {
  const count = await prisma.dish.count({ where: { restaurantId } })
  return prisma.dish.create({
    data: { ...data, restaurantId, sortOrder: count },
  })
}

export async function updateDish(
  id: string,
  data: {
    nameEn?: string
    nameFr?: string
    descriptionEn?: string
    descriptionFr?: string
    price?: number
    imageUrl?: string
    usdzUrl?: string
    glbUrl?: string
    subcategoryId?: string | null
    isActive?: boolean
    calories?: number | null
    isMostPurchased?: boolean
  }
) {
  return prisma.dish.update({ where: { id }, data })
}

export async function deleteDish(id: string) {
  return prisma.dish.delete({ where: { id } })
}
