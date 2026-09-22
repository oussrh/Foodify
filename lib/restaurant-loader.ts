// lib/restaurant-loader.ts
// The reads behind the restaurant pages that both portals share (the Tables sheet, the kitchen
// board): who the page is for, with the reader's own scope — a manager sees the restaurants
// they are assigned, a super admin any. The pages hold only their redirect, and the guard is
// asked once here rather than rewritten per page.
import prisma from '@/lib/prisma'
import { AuthError, requireBoardAccess, requireOrderingStaff, requireRestaurantAccess, requireUser } from '@/lib/auth-guard'
import { loadMenu } from '@/lib/menu-loader'
import { boardOrderSelect, serializeOrder } from '@/lib/order-data'
import { daysAgo } from '@/lib/time'

/** Whether the guard passes, as a boolean: a page redirects rather than throwing at a signed-out reader. */
async function passes(guard: () => Promise<unknown>): Promise<boolean> {
  try {
    await guard()
    return true
  } catch (error) {
    if (error instanceof AuthError) return false
    throw error
  }
}

/** Whether the signed-in user may manage this restaurant; false for a stranger, a kitchen tablet, and nobody signed in. */
const mayOpen = (id: string) => passes(() => requireRestaurantAccess({ id }))

/**
 * The Info tab's read: the restaurant, and how much its menu is being opened (all time, the last
 * thirty days, and how many of those views became an AR session). Null when the restaurant is not
 * this user's to open. The four counts run together: none of them depends on another.
 */
export async function loadRestaurantInfo(id: string) {
  if (!(await mayOpen(id))) return null
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    // `tableCount` so the QR section can say whether the per-table sheet has anything on it yet.
    select: { id: true, name: true, slug: true, tableCount: true },
  })
  if (!restaurant) return null
  const dish = { restaurantId: id }
  const [dishes, views, recent, arViews] = await Promise.all([
    prisma.dish.count({ where: { restaurantId: id, isActive: true } }),
    prisma.dishView.count({ where: { dish } }),
    prisma.dishView.count({ where: { dish, viewedAt: { gte: daysAgo(30) } } }),
    prisma.dishView.count({ where: { dish, arViewed: true } }),
  ])
  return { restaurant, stats: { dishes, views, recent, arViews } }
}

/** What the per-table QR sheet needs, or null when the restaurant is not this user's to open. */
export async function loadTablesRestaurant(id: string) {
  if (!(await mayOpen(id))) return null
  return prisma.restaurant.findUnique({ where: { id }, select: { id: true, name: true, slug: true, tableCount: true } })
}

/** How many orders the history shows: a page of work, not the whole archive; older ones are in the database. */
export const HISTORY_LIMIT = 100

/**
 * The history page's read: the restaurant (for its currency) and its recent orders, newest first,
 * as plain JSON (no Decimal, no Date) — every status, with the moments the waits are measured
 * from. Null when the restaurant is not this user's to open.
 */
export async function loadOrderHistory(id: string) {
  if (!(await mayOpen(id))) return null
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    select: { id: true, name: true, currency: true, currencySymbol: true, defaultLocale: true },
  })
  if (!restaurant) return null
  const rows = await prisma.order.findMany({
    where: { restaurantId: id },
    // `number` as the tie-break, not `id`: it is unique per restaurant and counts up, so two
    // orders taken in the same millisecond still read in the order they were taken. A uuid would
    // settle the comparison without meaning anything.
    orderBy: [{ createdAt: 'desc' }, { number: 'desc' }],
    take: HISTORY_LIMIT,
    select: boardOrderSelect,
  })
  return { restaurant, orders: rows.map(serializeOrder) }
}

/**
 * The restaurants the signed-in tablet (or whoever is signed in) is assigned to, for the page that
 * decides which board to open. Null when nobody is signed in; a super admin gets none, because a
 * super admin opens a board from the portal rather than from the tablet's landing page.
 */
export async function loadKitchenRestaurants() {
  let user: Awaited<ReturnType<typeof requireUser>>
  try {
    user = await requireUser()
  } catch (error) {
    if (error instanceof AuthError) return null
    throw error
  }
  return prisma.restaurant.findMany({
    where: { users: { some: { id: user.id } } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

/**
 * What the waiter app needs to take an order: the restaurant with its live menu, exactly as the
 * public page reads it (`loadMenu`), so a waiter and a guest can never be looking at different
 * menus. Null when the restaurant is not this user's to order for — a kitchen tablet is refused
 * here: it cooks what comes in, it does not write orders.
 */
export async function loadWaiterMenu(id: string) {
  if (!(await passes(() => requireOrderingStaff(id)))) return null
  const found = await prisma.restaurant.findUnique({ where: { id }, select: { slug: true } })
  if (!found) return null
  return loadMenu(found.slug)
}

/**
 * The People tab's read: the restaurant and everyone who works on it — its managers, its order
 * tablets and its waiters. Null when the restaurant is not this user's to manage (a device is
 * refused: it has no business reading who else has access).
 */
export async function loadRestaurantPeople(id: string) {
  if (!(await mayOpen(id))) return null
  return prisma.restaurant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      users: {
        where: { role: { in: ['RESTAURANT_ADMIN', 'KITCHEN', 'WAITER'] } },
        select: { id: true, email: true, username: true, emailVerified: true, lastLogin: true, createdAt: true, role: true },
        orderBy: { email: 'asc' },
      },
    },
  })
}

/** What the kitchen board needs, or null when the restaurant is not this user's to open; the orders themselves come from the board's endpoint on a timer. */
export async function loadBoardRestaurant(id: string) {
  if (!(await passes(() => requireBoardAccess(id)))) return null
  return prisma.restaurant.findUnique({
    where: { id },
    select: { id: true, name: true, orderingEnabled: true, currency: true, currencySymbol: true, defaultLocale: true },
  })
}
