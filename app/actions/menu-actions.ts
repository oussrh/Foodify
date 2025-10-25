'use server'

import prisma from '@/lib/prisma'

export async function getMenu(restaurantId: string) {
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

export async function createCategory(
  restaurantId: string,
  data: { nameEn: string; nameFr: string }
) {
  const count = await prisma.menuCategory.count({ where: { restaurantId } })
  return prisma.menuCategory.create({
    data: { ...data, restaurantId, sortOrder: count },
  })
}

export async function updateCategory(
  id: string,
  data: { nameEn?: string; nameFr?: string; isActive?: boolean }
) {
  return prisma.menuCategory.update({ where: { id }, data })
}

export async function toggleCategoryStatus(id: string) {
  const category = await prisma.menuCategory.findUnique({ where: { id } })
  if (!category) throw new Error('Category not found')
  return prisma.menuCategory.update({
    where: { id },
    data: { isActive: !category.isActive }
  })
}

export async function deleteCategory(id: string) {
  return prisma.menuCategory.delete({ where: { id } })
}

export async function createSubcategory(
  categoryId: string,
  data: { nameEn: string; nameFr: string }
) {
  const count = await prisma.menuSubcategory.count({ where: { categoryId } })
  return prisma.menuSubcategory.create({
    data: { ...data, categoryId, sortOrder: count },
  })
}

export async function updateSubcategory(
  id: string,
  data: { nameEn?: string; nameFr?: string; isActive?: boolean }
) {
  return prisma.menuSubcategory.update({ where: { id }, data })
}

export async function toggleSubcategoryStatus(id: string) {
  const subcategory = await prisma.menuSubcategory.findUnique({ where: { id } })
  if (!subcategory) throw new Error('Subcategory not found')
  return prisma.menuSubcategory.update({
    where: { id },
    data: { isActive: !subcategory.isActive }
  })
}

export async function deleteSubcategory(id: string) {
  return prisma.menuSubcategory.delete({ where: { id } })
}

export async function reorderCategories(restaurantId: string, ids: string[]) {
  await Promise.all(
    ids.map((id: string, index: number) =>
      prisma.menuCategory.update({ where: { id }, data: { sortOrder: index } })
    )
  )
}

export async function reorderSubcategories(categoryId: string, ids: string[]) {
  await Promise.all(
    ids.map((id: string, index: number) =>
      prisma.menuSubcategory.update({ where: { id }, data: { sortOrder: index } })
    )
  )
}
