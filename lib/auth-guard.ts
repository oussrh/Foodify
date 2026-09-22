// lib/auth-guard.ts
//
// Authorisation helpers for server actions and route handlers.
// Every exported function in a 'use server' file is a public HTTP endpoint,
// so each one must call one of these before touching the database.

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { fail } from '@/lib/api'

/**
 * Thrown by every guard here (requireSuperAdminPage catches it and redirects instead); `status` is 401 (nobody signed in) or 403 (signed in, not allowed).
 * A row that does not exist and a row that belongs to someone else raise the same 403 with the
 * same message, so an id cannot be probed through a guard.
 */
export class AuthError extends Error {
  status: 401 | 403
  constructor(message: string, status: 401 | 403) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

/** Route-handler helper: maps an AuthError to the envelope's failure, rethrows anything else. */
export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return fail(error.status === 401 ? 'unauthenticated' : 'forbidden', error.message, error.status)
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

/** The signed-in super admin, the role read from the database on this call (requireUser) so a demotion takes effect at once; 403 for any other role. */
export async function requireSuperAdmin() {
  const user = await requireUser()
  if (user.role !== 'SUPER_ADMIN') throw new AuthError('Forbidden', 403)
  return user
}

/**
 * The super-admin check a page makes on every render. Next keeps a layout mounted across client
 * navigations, so the admin layout's check runs once; a role change or a deletion after it is
 * only seen here (CACHE.2: an authorisation decision is never cached). A page redirects where
 * an action throws.
 */
export async function requireSuperAdminPage() {
  let user: Awaited<ReturnType<typeof requireUser>>
  try {
    user = await requireUser()
  } catch (error) {
    if (!(error instanceof AuthError)) throw error
    redirect('/admin/login')
  }
  if (user.role !== 'SUPER_ADMIN') redirect(user.role === 'RESTAURANT_ADMIN' ? '/manager' : '/')
  return user
}

/**
 * Super admins may manage any restaurant; restaurant admins only the ones
 * they are assigned to. Accepts an id or a slug.
 */
export async function requireRestaurantAccess(where: { id: string } | { slug: string }) {
  const user = await requireUser()
  if (user.role === 'SUPER_ADMIN') return user
  // A tablet and a waiter are assigned to the restaurant but manage nothing: they are refused
  // here and admitted only by the board guards, so adding one to a restaurant never grants a
  // write to its menu, its dishes, its settings or its people.
  if (user.role === 'KITCHEN' || user.role === 'WAITER') throw new AuthError('Forbidden', 403)

  const restaurant = await prisma.restaurant.findFirst({
    where: { ...where, users: { some: { id: user.id } } },
    select: { id: true },
  })
  if (!restaurant) throw new AuthError('Forbidden', 403)
  return user
}

/**
 * Who may READ one restaurant's orders: a super admin, and anyone assigned to that restaurant —
 * its managers, its kitchen tablets and its waiters. Everything else a restaurant has (its menu,
 * its dishes, its settings, its people) goes through `requireRestaurantAccess`, which refuses a
 * tablet and a waiter.
 */
export async function requireBoardAccess(restaurantId: string) {
  const user = await requireUser()
  if (user.role === 'SUPER_ADMIN') return user

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, users: { some: { id: user.id } } },
    select: { id: true },
  })
  if (!restaurant) throw new AuthError('Forbidden', 403)
  return user
}

/**
 * Anyone who works this restaurant's service: its managers, its order tablets, its waiters, and a
 * super admin. The same population as `requireBoardAccess`, but this one grants a write, so it is
 * named for what it is rather than borrowed from a read: marking a dish sold out is a service
 * decision, taken by whoever notices the pan is empty, and it expires by itself. It is the only
 * write a device has over the menu, and it changes no price, name or dish.
 */
export async function requireServiceStaff(restaurantId: string) {
  return requireBoardAccess(restaurantId)
}

/**
 * Who may MOVE one of its orders along — take it on, serve it, cancel it. The same people as
 * `requireBoardAccess` minus the waiters: a waiter reads the board to answer "is my food coming?",
 * and the kitchen alone says what has been made.
 */
export async function requireBoardAction(restaurantId: string) {
  const user = await requireBoardAccess(restaurantId)
  if (user.role === 'WAITER') throw new AuthError('Forbidden', 403)
  return user
}

/**
 * Carrying an order out to the table: the one move that belongs to the floor rather than the
 * pass, so a waiter passes this where `requireBoardAction` refuses them. A tablet and a manager
 * may do it too — a kitchen that plates and hands over in one motion should not have to find a
 * waiter to record it.
 */
export async function requireDeliverAction(restaurantId: string) {
  return requireBoardAccess(restaurantId)
}

/**
 * Who may place an order for a table from inside the restaurant: a super admin, a manager, or a
 * waiter of that restaurant. A kitchen tablet is refused — it cooks what comes in, it does not
 * write orders. Answers the user, whose id the order is stamped with.
 */
export async function requireOrderingStaff(restaurantId: string) {
  const user = await requireBoardAccess(restaurantId)
  if (user.role === 'KITCHEN') throw new AuthError('Forbidden', 403)
  return user
}

/** Grants on the dish's own restaurant and says which one it is, so a caller never has to be trusted for it. */
export async function requireDishAccess(dishId: string) {
  const dish = await prisma.dish.findUnique({ where: { id: dishId }, select: { restaurantId: true } })
  if (!dish) throw new AuthError('Forbidden', 403)
  await requireRestaurantAccess({ id: dish.restaurantId })
  return { restaurantId: dish.restaurantId }
}

/** Access through the ingredient's dish's restaurant; an unknown ingredient id is a 403 like a foreign one, so ids cannot be enumerated. */
export async function requireIngredientAccess(ingredientId: string) {
  const ingredient = await prisma.ingredient.findUnique({
    where: { id: ingredientId },
    select: { dish: { select: { restaurantId: true } } },
  })
  if (!ingredient) throw new AuthError('Forbidden', 403)
  return requireRestaurantAccess({ id: ingredient.dish.restaurantId })
}

/** Access through the category's restaurant; an unknown category id is a 403 like a foreign one, so ids cannot be enumerated. */
export async function requireCategoryAccess(categoryId: string) {
  const category = await prisma.menuCategory.findUnique({
    where: { id: categoryId },
    select: { restaurantId: true },
  })
  if (!category) throw new AuthError('Forbidden', 403)
  return requireRestaurantAccess({ id: category.restaurantId })
}

/**
 * A dish's subcategory must be one of its own restaurant's: a subcategory id is not a
 * restaurant grant, and a dish placed under another restaurant's subcategory would render on
 * that restaurant's public menu. Null (no subcategory) passes.
 */
export async function requireSubcategoryOf(restaurantId: string, subcategoryId: string | null | undefined) {
  if (!subcategoryId) return
  const owned = await prisma.menuSubcategory.findFirst({ where: { id: subcategoryId, category: { restaurantId } }, select: { id: true } })
  if (!owned) throw new AuthError('Forbidden', 403)
}

/** Access through the parent category's restaurant (a subcategory has no restaurantId of its own); an unknown id is a 403 like a foreign one. */
export async function requireSubcategoryAccess(subcategoryId: string) {
  const subcategory = await prisma.menuSubcategory.findUnique({
    where: { id: subcategoryId },
    select: { category: { select: { restaurantId: true } } },
  })
  if (!subcategory) throw new AuthError('Forbidden', 403)
  return requireRestaurantAccess({ id: subcategory.category.restaurantId })
}
