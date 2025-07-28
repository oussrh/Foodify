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
  
  // Only process AR URLs if they exist and are not already Cloudinary URLs or local paths
  const usdzUrl = data.usdzUrl && (data.usdzUrl.includes('cloudinary.com') || data.usdzUrl.startsWith('/'))
    ? data.usdzUrl 
    : data.usdzUrl 
      ? await uploadArAsset(data.usdzUrl, restaurantId)
      : ''
      
  const glbUrl = data.glbUrl && (data.glbUrl.includes('cloudinary.com') || data.glbUrl.startsWith('/'))
    ? data.glbUrl
    : data.glbUrl
      ? await uploadArAsset(data.glbUrl, restaurantId)
      : ''
  
  console.log('createDish - Final data being saved to database:', {
    restaurantId,
    usdzUrl,
    glbUrl,
    imageUrl: data.imageUrl
  })
  
  return prisma.dish.create({
    data: {
      nameEn: data.nameEn,
      nameFr: data.nameFr,
      descriptionEn: data.descriptionEn || '',
      descriptionFr: data.descriptionFr || '',
      price: data.price,
      imageUrl: data.imageUrl,
      subcategoryId: data.subcategoryId,
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
  
  // Only process AR URLs if they are not already Cloudinary URLs or local paths
  if (data.usdzUrl) {
    // If it's already a Cloudinary URL or local path starting with /, use it as-is
    if (data.usdzUrl.includes('cloudinary.com') || data.usdzUrl.startsWith('/')) {
      updatedData.usdzUrl = data.usdzUrl
    } else {
      updatedData.usdzUrl = await uploadArAsset(data.usdzUrl, restaurantId)
    }
  }
  
  if (data.glbUrl) {
    // If it's already a Cloudinary URL or local path starting with /, use it as-is
    if (data.glbUrl.includes('cloudinary.com') || data.glbUrl.startsWith('/')) {
      updatedData.glbUrl = data.glbUrl
    } else {
      updatedData.glbUrl = await uploadArAsset(data.glbUrl, restaurantId)
    }
  }
  
  console.log('updateDish - Final data being saved to database:', {
    id,
    updatedData: {
      usdzUrl: updatedData.usdzUrl,
      glbUrl: updatedData.glbUrl,
      imageUrl: updatedData.imageUrl
    }
  })
  
  return prisma.dish.update({ where: { id }, data: updatedData })
}

export async function deleteDish(id: string) {
  return prisma.dish.delete({ where: { id } })
}

// Toggle dish activation status
export async function toggleDishStatus(id: string) {
  const dish = await prisma.dish.findUnique({ where: { id }, select: { isActive: true } })
  if (!dish) throw new Error('Dish not found')
  
  return prisma.dish.update({
    where: { id },
    data: { isActive: !dish.isActive }
  })
}

// Update dish price
export async function updateDishPrice(id: string, price: number) {
  return prisma.dish.update({
    where: { id },
    data: { price }
  })
}

// Toggle most purchased status
export async function toggleMostPurchased(id: string) {
  const dish = await prisma.dish.findUnique({ where: { id }, select: { isMostPurchased: true } })
  if (!dish) throw new Error('Dish not found')
  
  return prisma.dish.update({
    where: { id },
    data: { isMostPurchased: !dish.isMostPurchased }
  })
}

// Add ingredient to dish
export async function addIngredient(dishId: string, data: { nameEn: string; nameFr: string }) {
  return prisma.ingredient.create({
    data: {
      dishId,
      nameEn: data.nameEn,
      nameFr: data.nameFr
    }
  })
}

// Update ingredient
export async function updateIngredient(id: string, data: { nameEn?: string; nameFr?: string }) {
  return prisma.ingredient.update({
    where: { id },
    data
  })
}

// Delete ingredient
export async function deleteIngredient(id: string) {
  return prisma.ingredient.delete({ where: { id } })
}

// Get dish with all details including ingredients
export async function getDishDetails(id: string) {
  return prisma.dish.findUnique({
    where: { id },
    include: {
      ingredients: {
        orderBy: { nameEn: 'asc' }
      },
      subcategory: {
        include: {
          category: true
        }
      },
      views: true,
      _count: {
        select: {
          views: true
        }
      }
    }
  })
}
