'use server'

import prisma from '@/lib/prisma'
import { requireCategoryAccess, requireRestaurantAccess, requireSubcategoryAccess } from '@/lib/auth-guard'
import { uuid } from '@/lib/schemas/common'
import { categoryInput, categoryPatch, order, type CategoryInput, type CategoryPatch } from '@/lib/schemas/menu'

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

export async function createCategory(rawRestaurantId: string, raw: CategoryInput) {
  await requireRestaurantAccess({ id: rawRestaurantId })
  const restaurantId = uuid.parse(rawRestaurantId)
  const data = categoryInput.parse(raw)
  const count = await prisma.menuCategory.count({ where: { restaurantId } })
  return prisma.menuCategory.create({
    data: { ...data, restaurantId, sortOrder: count },
  })
}

export async function updateCategory(rawId: string, raw: CategoryPatch) {
  await requireCategoryAccess(rawId)
  const id = uuid.parse(rawId)
  const data = categoryPatch.parse(raw)
  return prisma.menuCategory.update({ where: { id }, data })
}

export async function toggleCategoryStatus(rawId: string) {
  await requireCategoryAccess(rawId)
  const id = uuid.parse(rawId)
  const category = await prisma.menuCategory.findUnique({ where: { id } })
  if (!category) throw new Error('Category not found')
  return prisma.menuCategory.update({
    where: { id },
    data: { isActive: !category.isActive }
  })
}

export async function deleteCategory(rawId: string) {
  await requireCategoryAccess(rawId)
  const id = uuid.parse(rawId)
  return prisma.menuCategory.delete({ where: { id } })
}

export async function createSubcategory(rawCategoryId: string, raw: CategoryInput) {
  await requireCategoryAccess(rawCategoryId)
  const categoryId = uuid.parse(rawCategoryId)
  const data = categoryInput.parse(raw)
  const count = await prisma.menuSubcategory.count({ where: { categoryId } })
  return prisma.menuSubcategory.create({
    data: { ...data, categoryId, sortOrder: count },
  })
}

export async function updateSubcategory(rawId: string, raw: CategoryPatch) {
  await requireSubcategoryAccess(rawId)
  const id = uuid.parse(rawId)
  const data = categoryPatch.parse(raw)
  return prisma.menuSubcategory.update({ where: { id }, data })
}

export async function toggleSubcategoryStatus(rawId: string) {
  await requireSubcategoryAccess(rawId)
  const id = uuid.parse(rawId)
  const subcategory = await prisma.menuSubcategory.findUnique({ where: { id } })
  if (!subcategory) throw new Error('Subcategory not found')
  return prisma.menuSubcategory.update({
    where: { id },
    data: { isActive: !subcategory.isActive }
  })
}

export async function deleteSubcategory(rawId: string) {
  await requireSubcategoryAccess(rawId)
  const id = uuid.parse(rawId)
  return prisma.menuSubcategory.delete({ where: { id } })
}

export async function reorderCategories(rawRestaurantId: string, rawIds: string[]) {
  await requireRestaurantAccess({ id: rawRestaurantId })
  const restaurantId = uuid.parse(rawRestaurantId)
  const ids = order.parse(rawIds)
  await Promise.all(
    ids.map((id: string, index: number) =>
      prisma.menuCategory.updateMany({ where: { id, restaurantId }, data: { sortOrder: index } })
    )
  )
}

export async function reorderSubcategories(rawCategoryId: string, rawIds: string[]) {
  await requireCategoryAccess(rawCategoryId)
  const categoryId = uuid.parse(rawCategoryId)
  const ids = order.parse(rawIds)
  await Promise.all(
    ids.map((id: string, index: number) =>
      prisma.menuSubcategory.updateMany({ where: { id, categoryId }, data: { sortOrder: index } })
    )
  )
}
