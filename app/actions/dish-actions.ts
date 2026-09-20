'use server'

import prisma from '@/lib/prisma'
import { uploadArAsset } from '@/lib/cloudinary'
import { requireDishAccess, requireIngredientAccess, requireRestaurantAccess } from '@/lib/auth-guard'

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
    calories?: number | null
    isMostPurchased?: boolean
    dietary?: string[]
    allergens?: string[]
  }
) {
  await requireRestaurantAccess({ id: restaurantId })
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
      calories: data.calories ?? null,
      isMostPurchased: data.isMostPurchased ?? false,
      dietary: data.dietary ?? [],
      allergens: data.allergens ?? [],
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
    dietary?: string[]
    allergens?: string[]
  }
) {
  await requireDishAccess(id)
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
  await requireDishAccess(id)
  return prisma.dish.delete({ where: { id } })
}

// Toggle dish activation status
export async function toggleDishStatus(id: string) {
  await requireDishAccess(id)
  const dish = await prisma.dish.findUnique({ where: { id }, select: { isActive: true } })
  if (!dish) throw new Error('Dish not found')
  
  return prisma.dish.update({
    where: { id },
    data: { isActive: !dish.isActive }
  })
}

// Toggle most purchased status
export async function toggleMostPurchased(id: string) {
  await requireDishAccess(id)
  const dish = await prisma.dish.findUnique({ where: { id }, select: { isMostPurchased: true } })
  if (!dish) throw new Error('Dish not found')
  
  return prisma.dish.update({
    where: { id },
    data: { isMostPurchased: !dish.isMostPurchased }
  })
}

// Add ingredient to dish
export async function addIngredient(dishId: string, data: { nameEn: string; nameFr: string }) {
  await requireDishAccess(dishId)
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
  await requireIngredientAccess(id)
  return prisma.ingredient.update({
    where: { id },
    data
  })
}

// Delete ingredient
export async function deleteIngredient(id: string) {
  await requireIngredientAccess(id)
  return prisma.ingredient.delete({ where: { id } })
}

