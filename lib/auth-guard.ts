// lib/auth-guard.ts
//
// Authorisation helpers for server actions and route handlers.
// Every exported function in a 'use server' file is a public HTTP endpoint,
// so each one must call one of these before touching the database.

import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export class AuthError extends Error {
  status: 401 | 403
  constructor(message: string, status: 401 | 403) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

/** Route-handler helper: maps an AuthError to a JSON response, rethrows anything else. */
export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status })
  }
  throw error
}

/**
 * The signed-in user, re-read from the database so that role changes and
 * deletions take effect immediately rather than at JWT expiry.
 */
export async function requireUser() {
  const session = await auth()
  const id = session?.user?.id
  const email = session?.user?.email
  if (!id && !email) throw new AuthError('Not authenticated', 401)

  const user = await prisma.user.findUnique({
    where: id ? { id } : { email: email! },
    select: { id: true, email: true, role: true },
  })
  if (!user) throw new AuthError('Not authenticated', 401)
  return user
}

export async function requireSuperAdmin() {
  const user = await requireUser()
  if (user.role !== 'SUPER_ADMIN') throw new AuthError('Forbidden', 403)
  return user
}

/**
 * Super admins may manage any restaurant; restaurant admins only the ones
 * they are assigned to. Accepts an id or a slug.
 */
export async function requireRestaurantAccess(where: { id: string } | { slug: string }) {
  const user = await requireUser()
  if (user.role === 'SUPER_ADMIN') return user

  const restaurant = await prisma.restaurant.findFirst({
    where: { ...where, users: { some: { id: user.id } } },
    select: { id: true },
  })
  if (!restaurant) throw new AuthError('Forbidden', 403)
  return user
}

/** Grants on the dish's own restaurant and says which one it is, so a caller never has to be trusted for it. */
export async function requireDishAccess(dishId: string) {
  const dish = await prisma.dish.findUnique({ where: { id: dishId }, select: { restaurantId: true } })
  if (!dish) throw new AuthError('Forbidden', 403)
  await requireRestaurantAccess({ id: dish.restaurantId })
  return { restaurantId: dish.restaurantId }
}

export async function requireIngredientAccess(ingredientId: string) {
  const ingredient = await prisma.ingredient.findUnique({
    where: { id: ingredientId },
    select: { dish: { select: { restaurantId: true } } },
  })
  if (!ingredient) throw new AuthError('Forbidden', 403)
  return requireRestaurantAccess({ id: ingredient.dish.restaurantId })
}

export async function requireCategoryAccess(categoryId: string) {
  const category = await prisma.menuCategory.findUnique({
    where: { id: categoryId },
    select: { restaurantId: true },
  })
  if (!category) throw new AuthError('Forbidden', 403)
  return requireRestaurantAccess({ id: category.restaurantId })
}

export async function requireSubcategoryAccess(subcategoryId: string) {
  const subcategory = await prisma.menuSubcategory.findUnique({
    where: { id: subcategoryId },
    select: { category: { select: { restaurantId: true } } },
  })
  if (!subcategory) throw new AuthError('Forbidden', 403)
  return requireRestaurantAccess({ id: subcategory.category.restaurantId })
}
