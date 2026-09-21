// lib/menu-loader.ts
// The public menu route's reads: a restaurant with its live menu tree in display order, and
// the live dishes outside any category. A dish is shown under a subcategory only when it is the
// restaurant's own: the join is by subcategory id, and a dish row names its restaurant, so the
// menu never renders a dish another restaurant placed under one of these subcategories.
import prisma from '@/lib/prisma'

/** Null when no restaurant has the slug; the route answers 404. */
export async function loadMenu(slug: string) {
  const found = await prisma.restaurant.findUnique({ where: { slug }, select: { id: true } })
  if (!found) return null

  const restaurant = await prisma.restaurant.findUniqueOrThrow({
    where: { id: found.id },
    include: {
      categories: {
        include: {
          subcategories: {
            include: {
              dishes: {
                where: { isActive: true, restaurantId: found.id },
                include: { ingredients: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  const uncategorizedDishes = await prisma.dish.findMany({
    where: { restaurantId: restaurant.id, subcategoryId: null, isActive: true },
    include: { ingredients: true },
    orderBy: { sortOrder: 'asc' },
  })

  return { restaurant, uncategorizedDishes }
}
