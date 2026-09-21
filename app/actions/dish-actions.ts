'use server'

import prisma from '@/lib/prisma'
import { uploadArAsset } from '@/lib/cloudinary'
import { requireDishAccess, requireIngredientAccess, requireRestaurantAccess, requireSubcategoryOf } from '@/lib/auth-guard'
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

/**
 * The restaurant's admin or a super admin. Parses the restaurant id as a UUID and `dishInput` (bilingual name, decimal
 * price string, image URL; the rest optional), refuses a subcategory of another restaurant and uploads an AR URL that is
 * neither Cloudinary nor local to a folder named by the restaurant's id. Takes the next sortOrder; answers `dishPayload`.
 */
export async function createDish(rawRestaurantId: string, raw: DishInput) {
  await requireRestaurantAccess({ id: rawRestaurantId })
  const restaurantId = uuid.parse(rawRestaurantId)
  const data = dishInput.parse(raw)
  await requireSubcategoryOf(restaurantId, data.subcategoryId)
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

/**
 * The dish's restaurant's admin or a super admin: the grant comes from the row, not from the caller. Parses the id as a
 * UUID and `dishPatch` (every field optional, plus isActive); a subcategory must be the restaurant's own, an AR URL is
 * uploaded only when non-empty ('' clears it), an absent member leaves the column. Answers `dishPayload`.
 */
export async function updateDish(rawId: string, raw: DishPatch) {
  const { restaurantId } = await requireDishAccess(rawId)
  const id = uuid.parse(rawId)
  const data = dishPatch.parse(raw)
  await requireSubcategoryOf(restaurantId, data.subcategoryId)
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

/**
 * The dish's restaurant's admin or a super admin. Parses the id as a UUID, deletes the row and answers `{ id }`. The
 * database refuses the delete while the dish has an ingredient or a view (both restrict), and nothing here removes them first.
 */
export async function deleteDish(rawId: string) {
  await requireDishAccess(rawId)
  const id = uuid.parse(rawId)
  return prisma.dish.delete({ select: idOnly, where: { id } })
}

/**
 * The dish's restaurant's admin or a super admin. Parses the id as a UUID and flips `isActive` from the stored value: the
 * caller sends no target state, so two toggles racing from one read make one flip. Answers `dishPayload`; 'Dish not found'
 * only follows a delete between the guard and the read, a missing dish being Forbidden at the guard.
 */
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

/**
 * The dish's restaurant's admin or a super admin. Parses the id as a UUID and flips `isMostPurchased` from the stored
 * value, the caller sending no target state. Answers `dishPayload`; a missing dish is Forbidden at the guard.
 */
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

/**
 * The dish's restaurant's admin or a super admin. Parses the dish id as a UUID and `ingredientInput` (both names
 * required) and answers `ingredientPayload` (id, nameEn, nameFr). Ingredients carry no order and no uniqueness: the same
 * name twice is two rows.
 */
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

/**
 * The admin of the restaurant of the ingredient's dish, or a super admin. Parses the id as a UUID and `ingredientPatch`
 * (either name optional); an absent name leaves the column. Answers `ingredientPayload` (id, nameEn, nameFr).
 */
export async function updateIngredient(rawId: string, raw: IngredientPatch) {
  await requireIngredientAccess(rawId)
  const id = uuid.parse(rawId)
  const data = ingredientPatch.parse(raw)
  return prisma.ingredient.update({ select: ingredientPayload,
    where: { id },
    data: definedFields(data)
  })
}

/**
 * The admin of the restaurant of the ingredient's dish, or a super admin. Parses the id as a UUID, deletes the row and
 * answers `{ id }`.
 */
export async function deleteIngredient(rawId: string) {
  await requireIngredientAccess(rawId)
  const id = uuid.parse(rawId)
  return prisma.ingredient.delete({ select: idOnly, where: { id } })
}

