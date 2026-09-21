'use server'

import prisma from '@/lib/prisma'
import { requireCategoryAccess, requireRestaurantAccess, requireSubcategoryAccess } from '@/lib/auth-guard'
import { uuid } from '@/lib/schemas/common'
import { categoryPayload, idOnly } from '@/lib/payloads'
import { definedFields } from '@/lib/defined-fields'
import { categoryInput, categoryPatch, order, type CategoryInput, type CategoryPatch } from '@/lib/schemas/menu'

/**
 * The restaurant's admin or a super admin: the one read in this file. Parses the id as a UUID and answers the
 * restaurant's categories with their subcategories, both in sortOrder, inactive ones included (the dashboard's view,
 * not the guest's), as the rows are stored rather than a payload; dishes are not included.
 */
export async function getMenu(rawRestaurantId: string) {
  await requireRestaurantAccess({ id: rawRestaurantId })
  const restaurantId = uuid.parse(rawRestaurantId)
  return prisma.menuCategory.findMany({
    where: { restaurantId },
    include: {
      subcategories: {
        orderBy: { sortOrder: 'asc' }
      }
    },
    orderBy: { sortOrder: 'asc' },
  })
}

/**
 * The restaurant's admin or a super admin. Parses the id as a UUID and `categoryInput` (both names required), gives the
 * category the next sortOrder (the restaurant's category count) and answers `categoryPayload` (id, names, sortOrder, isActive).
 */
export async function createCategory(rawRestaurantId: string, raw: CategoryInput) {
  await requireRestaurantAccess({ id: rawRestaurantId })
  const restaurantId = uuid.parse(rawRestaurantId)
  const data = categoryInput.parse(raw)
  const count = await prisma.menuCategory.count({ where: { restaurantId } })
  return prisma.menuCategory.create({ select: categoryPayload,
    data: { ...data, restaurantId, sortOrder: count },
  })
}

/**
 * The admin of the category's restaurant, or a super admin: the grant comes from the row. Parses the id as a UUID and
 * `categoryPatch` (names and isActive, each optional); an absent member leaves the column. Answers `categoryPayload`.
 */
export async function updateCategory(rawId: string, raw: CategoryPatch) {
  await requireCategoryAccess(rawId)
  const id = uuid.parse(rawId)
  const data = categoryPatch.parse(raw)
  return prisma.menuCategory.update({ select: categoryPayload, where: { id }, data: definedFields(data) })
}

/**
 * The admin of the category's restaurant, or a super admin. Parses the id as a UUID and flips `isActive` from the stored
 * value, the caller sending no target state; its subcategories and dishes keep their own flags. Answers `categoryPayload`.
 */
export async function toggleCategoryStatus(rawId: string) {
  await requireCategoryAccess(rawId)
  const id = uuid.parse(rawId)
  const category = await prisma.menuCategory.findUnique({ where: { id } })
  if (!category) throw new Error('Category not found')
  return prisma.menuCategory.update({ select: categoryPayload,
    where: { id },
    data: { isActive: !category.isActive }
  })
}

/**
 * The admin of the category's restaurant, or a super admin. Parses the id as a UUID, deletes the row and answers `{ id }`.
 * The schema cascades to its subcategories and their dishes, and refuses the whole delete while any of those dishes has
 * an ingredient or a view.
 */
export async function deleteCategory(rawId: string) {
  await requireCategoryAccess(rawId)
  const id = uuid.parse(rawId)
  return prisma.menuCategory.delete({ select: idOnly, where: { id } })
}

/**
 * The admin of the parent category's restaurant, or a super admin. Parses the category id as a UUID and `categoryInput`
 * (both names required), gives the subcategory the next sortOrder among its category's own and answers `categoryPayload`.
 */
export async function createSubcategory(rawCategoryId: string, raw: CategoryInput) {
  await requireCategoryAccess(rawCategoryId)
  const categoryId = uuid.parse(rawCategoryId)
  const data = categoryInput.parse(raw)
  const count = await prisma.menuSubcategory.count({ where: { categoryId } })
  return prisma.menuSubcategory.create({ select: categoryPayload,
    data: { ...data, categoryId, sortOrder: count },
  })
}

/**
 * The admin of the subcategory's restaurant (through its category), or a super admin. Parses the id as a UUID and
 * `categoryPatch` (names and isActive, each optional); an absent member leaves the column. Answers `categoryPayload`.
 */
export async function updateSubcategory(rawId: string, raw: CategoryPatch) {
  await requireSubcategoryAccess(rawId)
  const id = uuid.parse(rawId)
  const data = categoryPatch.parse(raw)
  return prisma.menuSubcategory.update({ select: categoryPayload, where: { id }, data: definedFields(data) })
}

/**
 * The admin of the subcategory's restaurant, or a super admin. Parses the id as a UUID and flips `isActive` from the
 * stored value, the caller sending no target state; its dishes keep their own flag. Answers `categoryPayload`.
 */
export async function toggleSubcategoryStatus(rawId: string) {
  await requireSubcategoryAccess(rawId)
  const id = uuid.parse(rawId)
  const subcategory = await prisma.menuSubcategory.findUnique({ where: { id } })
  if (!subcategory) throw new Error('Subcategory not found')
  return prisma.menuSubcategory.update({ select: categoryPayload,
    where: { id },
    data: { isActive: !subcategory.isActive }
  })
}

/**
 * The admin of the subcategory's restaurant, or a super admin. Parses the id as a UUID, deletes the row and answers `{ id }`.
 * The schema cascades to the dishes under it (they are not orphaned, they go) and refuses the delete while any of them has
 * an ingredient or a view.
 */
export async function deleteSubcategory(rawId: string) {
  await requireSubcategoryAccess(rawId)
  const id = uuid.parse(rawId)
  return prisma.menuSubcategory.delete({ select: idOnly, where: { id } })
}

/**
 * The restaurant's admin or a super admin. Parses the restaurant id as a UUID and the ids against `order` (an array of
 * UUIDs); each id takes its index as sortOrder, but only where the row is this restaurant's, so a foreign or unknown id
 * moves nothing. Answers `{ count }`, how many ids were this restaurant's rows, for a caller to compare with what it sent.
 */
export async function reorderCategories(rawRestaurantId: string, rawIds: string[]) {
  await requireRestaurantAccess({ id: rawRestaurantId })
  const restaurantId = uuid.parse(rawRestaurantId)
  const ids = order.parse(rawIds)
  const moved = await Promise.all(
    ids.map((id: string, index: number) =>
      prisma.menuCategory.updateMany({ where: { id, restaurantId }, data: { sortOrder: index } })
    )
  )
  return { count: moved.reduce((n, r) => n + r.count, 0) }
}

/**
 * The admin of the category's restaurant, or a super admin. Parses the category id as a UUID and the ids against `order`;
 * each id takes its index as sortOrder, but only where the row is this category's, so a subcategory of another category
 * moves nothing. Answers `{ count }`, the number of ids that were this category's rows.
 */
export async function reorderSubcategories(rawCategoryId: string, rawIds: string[]) {
  await requireCategoryAccess(rawCategoryId)
  const categoryId = uuid.parse(rawCategoryId)
  const ids = order.parse(rawIds)
  const moved = await Promise.all(
    ids.map((id: string, index: number) =>
      prisma.menuSubcategory.updateMany({ where: { id, categoryId }, data: { sortOrder: index } })
    )
  )
  return { count: moved.reduce((n, r) => n + r.count, 0) }
}
