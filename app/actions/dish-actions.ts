'use server'

import prisma from '@/lib/prisma'
import { uploadArAsset } from '@/lib/cloudinary'
import { requireDishAccess, requireIngredientAccess, requireRestaurantAccess } from '@/lib/auth-guard'
import { uuid } from '@/lib/schemas/common'
import { dishPayload, idOnly, ingredientPayload } from '@/lib/payloads'
import { definedFields } from '@/lib/defined-fields'
import {
  dishInput,
  dishPatch,
  ingredientInput,
  ingredientPatch,
  type DishInput,
  type DishPatch,
  type IngredientInput,
  type IngredientPatch,
} from '@/lib/schemas/dish'

/**
 * The AR asset URL as it is stored: a Cloudinary URL or a local path (`/...`) as-is, anything
 * else uploaded to the restaurant's Cloudinary folder, nothing as ''.
 */
async function storedArUrl(url: string | undefined, restaurantId: string): Promise<string> {
  if (!url) return ''
  if (url.includes('cloudinary.com') || url.startsWith('/')) return url
  return uploadArAsset(url, restaurantId)
}

export async function createDish(rawRestaurantId: string, raw: DishInput) {
  await requireRestaurantAccess({ id: rawRestaurantId })
  const restaurantId = uuid.parse(rawRestaurantId)
  const data = dishInput.parse(raw)
  const count = await prisma.dish.count({ where: { restaurantId } })

  const usdzUrl = await storedArUrl(data.usdzUrl, restaurantId)
  const glbUrl = await storedArUrl(data.glbUrl, restaurantId)

  console.log('createDish - Final data being saved to database:', {
    restaurantId,
    usdzUrl,
    glbUrl,
    imageUrl: data.imageUrl
  })

  return prisma.dish.create({ select: dishPayload,
    data: {
      nameEn: data.nameEn,
      nameFr: data.nameFr,
      descriptionEn: data.descriptionEn || '',
      descriptionFr: data.descriptionFr || '',
      price: data.price,
      imageUrl: data.imageUrl,
      subcategoryId: data.subcategoryId ?? null,
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

export async function updateDish(rawId: string, raw: DishPatch) {
  const { restaurantId } = await requireDishAccess(rawId)
  const id = uuid.parse(rawId)
  const data = dishPatch.parse(raw)
  const updatedData = { ...data }

  // An AR URL is only touched when the patch carries one.
  if (data.usdzUrl) updatedData.usdzUrl = await storedArUrl(data.usdzUrl, restaurantId)
  if (data.glbUrl) updatedData.glbUrl = await storedArUrl(data.glbUrl, restaurantId)

  console.log('updateDish - Final data being saved to database:', {
    id,
    updatedData: {
      usdzUrl: updatedData.usdzUrl,
      glbUrl: updatedData.glbUrl,
      imageUrl: updatedData.imageUrl
    }
  })

  return prisma.dish.update({ select: dishPayload, where: { id }, data: definedFields(updatedData) })
}

export async function deleteDish(rawId: string) {
  await requireDishAccess(rawId)
  const id = uuid.parse(rawId)
  return prisma.dish.delete({ select: idOnly, where: { id } })
}

// Toggle dish activation status
export async function toggleDishStatus(rawId: string) {
  await requireDishAccess(rawId)
  const id = uuid.parse(rawId)
  const dish = await prisma.dish.findUnique({ where: { id }, select: { isActive: true } })
  if (!dish) throw new Error('Dish not found')

  return prisma.dish.update({ select: dishPayload,
    where: { id },
    data: { isActive: !dish.isActive }
  })
}

// Toggle most purchased status
export async function toggleMostPurchased(rawId: string) {
  await requireDishAccess(rawId)
  const id = uuid.parse(rawId)
  const dish = await prisma.dish.findUnique({ where: { id }, select: { isMostPurchased: true } })
  if (!dish) throw new Error('Dish not found')

  return prisma.dish.update({ select: dishPayload,
    where: { id },
    data: { isMostPurchased: !dish.isMostPurchased }
  })
}

// Add ingredient to dish
export async function addIngredient(rawDishId: string, raw: IngredientInput) {
  await requireDishAccess(rawDishId)
  const dishId = uuid.parse(rawDishId)
  const data = ingredientInput.parse(raw)
  return prisma.ingredient.create({ select: ingredientPayload,
    data: {
      dishId,
      nameEn: data.nameEn,
      nameFr: data.nameFr
    }
  })
}

// Update ingredient
export async function updateIngredient(rawId: string, raw: IngredientPatch) {
  await requireIngredientAccess(rawId)
  const id = uuid.parse(rawId)
  const data = ingredientPatch.parse(raw)
  return prisma.ingredient.update({ select: ingredientPayload,
    where: { id },
    data: definedFields(data)
  })
}

// Delete ingredient
export async function deleteIngredient(rawId: string) {
  await requireIngredientAccess(rawId)
  const id = uuid.parse(rawId)
  return prisma.ingredient.delete({ select: idOnly, where: { id } })
}

