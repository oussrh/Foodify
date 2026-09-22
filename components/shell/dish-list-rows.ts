// components/shell/dish-list-rows.ts
// A dish row with its category tree, as Prisma returns it, to the row the dishes table shows.
import type { Dish, MenuCategory, MenuSubcategory } from '@/generated/prisma/client'
import type { DishListRow } from '@/components/shell/dishes-list'
import { isSoldOut } from '@/lib/availability'

type DishWithCategory = Dish & { subcategory: (MenuSubcategory & { category: MenuCategory }) | null }

/** The category label: the category alone when its subcategory repeats its name, else both. */
function categoryLabel(subcategory: MenuSubcategory & { category: MenuCategory }): string {
  return subcategory.nameEn.toLowerCase() === subcategory.category.nameEn.toLowerCase()
    ? subcategory.category.nameEn
    : `${subcategory.category.nameEn} · ${subcategory.nameEn}`
}

/** Money as the two-decimal string, AR as one flag, the category as its label. */
export function dishListRow(d: DishWithCategory): DishListRow {
  return {
    id: d.id,
    nameEn: d.nameEn,
    nameFr: d.nameFr,
    imageUrl: d.imageUrl,
    price: d.price.toFixed(2),
    isActive: d.isActive,
    // Read here, not sent as a moment: the table says sold out or not, and nothing downstream
    // has to know that the state expires by itself.
    soldOut: isSoldOut(d.soldOutUntil),
    isMostPurchased: d.isMostPurchased,
    hasAR: Boolean(d.usdzUrl || d.glbUrl),
    category: d.subcategory ? categoryLabel(d.subcategory) : null,
    createdAt: d.createdAt,
  }
}
