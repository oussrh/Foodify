// lib/menu-loader.ts
// The public menu route's reads: a restaurant with its live menu tree in display order, and
// the live dishes outside any category.
import prisma from '@/lib/prisma'

/** Null when no restaurant has the slug; the route answers 404. */
export async function loadMenu(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        include: {
          subcategories: {
            include: {
              dishes: {
                where: { isActive: true },
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

  if (!restaurant) return null

  const uncategorizedDishes = await prisma.dish.findMany({
    where: { restaurantId: restaurant.id, subcategoryId: null, isActive: true },
    include: { ingredients: true },
    orderBy: { sortOrder: 'asc' },
  })

  return { restaurant, uncategorizedDishes }
}
