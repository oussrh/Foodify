'use server'

import prisma from '@/lib/prisma'
import { uploadArAsset } from '@/lib/cloudinary'

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
  const [usdzUrl, glbUrl] = await Promise.all([
    uploadArAsset(data.usdzUrl, restaurantId),
    uploadArAsset(data.glbUrl, restaurantId),
  ])
  return prisma.dish.create({
    data: {
      ...data,
      usdzUrl,
      glbUrl,
      restaurantId,
      sortOrder: count,
    },
  })
}

export async function updateDish(
  id: string,
  restaurantId: string,
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
  const updatedData = { ...data }
  if (data.usdzUrl) {
    updatedData.usdzUrl = await uploadArAsset(data.usdzUrl, restaurantId)
  }
  if (data.glbUrl) {
    updatedData.glbUrl = await uploadArAsset(data.glbUrl, restaurantId)
  }
  return prisma.dish.update({ where: { id }, data: updatedData })
}

export async function deleteDish(id: string) {
  return prisma.dish.delete({ where: { id } })
}
