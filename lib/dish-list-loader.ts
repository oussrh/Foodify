// lib/dish-list-loader.ts
// The query both portals' Dishes tabs read their rows with (components/shell/dish-list-rows.ts
// turns each row into what the table shows). The pages keep their own guard in front of it.
import type { Prisma } from '@/generated/prisma/client'

/**
 * The dishes table's query for one restaurant: its dishes with their category tree, in menu order
 * then newest first, narrowed by `search` (either language's name or description, any case) when
 * there is one. Both portals' Dishes tabs read it, with their own guard in front.
 */
export function dishListArgs(restaurantId: string, search: string) {
  const text = { contains: search, mode: 'insensitive' as const }
  const where: Prisma.DishWhereInput = search
    ? { restaurantId, OR: [{ nameEn: text }, { nameFr: text }, { descriptionEn: text }, { descriptionFr: text }] }
    : { restaurantId }
  return {
    where,
    include: { subcategory: { include: { category: true } } } as const,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] satisfies Prisma.DishOrderByWithRelationInput[],
  }
}
