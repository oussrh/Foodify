// lib/menu-data.ts
// Serializers from Prisma rows to the plain shapes the customer pages render.
import type { Dish, Ingredient, MenuCategory as CategoryRow, MenuSubcategory as SubcategoryRow, Restaurant } from '@/generated/prisma/client'
import { publicEnv } from '@/lib/env'
import type { CoverStyle, Locale, MenuCategory, MenuDish, MenuRestaurant, MenuTheme } from './menu'

type DishRow = Dish & { ingredients: Ingredient[] }
type CategoryTree = CategoryRow & { subcategories: (SubcategoryRow & { dishes: DishRow[] })[] }

/**
 * Prisma's Decimal price becomes the two-fraction-digit string of MenuDish (never a float) and
 * empty-string columns become null, so the shape crosses the server/client boundary as plain
 * JSON and a consumer tests for null alone. With `offered` (the restaurant's dietary options)
 * the dish keeps only those tags: the public menu shows what the restaurant offers, and a tag
 * set before the restaurant narrowed its list stays stored, unseen.
 */
export function serializeDish(dish: DishRow, offered?: readonly string[]): MenuDish {
  return {
    id: dish.id,
    nameEn: dish.nameEn,
    nameFr: dish.nameFr,
    descriptionEn: dish.descriptionEn || null,
    descriptionFr: dish.descriptionFr || null,
    price: dish.price.toFixed(2),
    imageUrl: dish.imageUrl || null,
    usdzUrl: dish.usdzUrl || null,
    glbUrl: dish.glbUrl || null,
    calories: dish.calories ?? null,
    isMostPurchased: dish.isMostPurchased,
    dietary: offered ? dish.dietary.filter((k) => offered.includes(k)) : dish.dietary,
    allergens: dish.allergens,
    ingredients: dish.ingredients.map((i) => ({ id: i.id, nameEn: i.nameEn, nameFr: i.nameFr })),
  }
}

/**
 * The row as MenuRestaurant: the enum-like columns (cover style, theme, locale) are coerced to
 * their closed sets with a default for anything unknown and the symbol to '$', so an old or
 * hand-edited row still renders. openingHours and socialMedia stay raw; their parsers run later.
 */
export function serializeRestaurant(restaurant: Restaurant): MenuRestaurant {
  return {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    tagline: restaurant.tagline,
    logoUrl: restaurant.logoUrl,
    coverImageUrl: restaurant.coverImageUrl,
    coverImageStyle: (restaurant.coverImageStyle === 'repeat' ? 'repeat' : 'cover') as CoverStyle,
    menuTheme: (['light', 'dark'].includes(restaurant.menuTheme) ? restaurant.menuTheme : 'system') as MenuTheme,
    colorTheme: restaurant.colorTheme,
    defaultLocale: (restaurant.defaultLocale === 'fr' ? 'fr' : 'en') as Locale,
    fontFamily: restaurant.fontFamily,
    googleFontUrl: restaurant.googleFontUrl,
    currencySymbol: restaurant.currencySymbol || '$',
    currency: restaurant.currency || null,
    cuisineType: restaurant.cuisineType,
    city: restaurant.city,
    streetAddress: restaurant.streetAddress,
    state: restaurant.state,
    postalCode: restaurant.postalCode,
    country: restaurant.country,
    phone: restaurant.phone,
    email: restaurant.email,
    website: restaurant.website,
    openingHours: restaurant.openingHours,
    socialMedia: restaurant.socialMedia,
    socialDisplay: restaurant.socialDisplay === 'text' ? 'text' : 'icons',
    dietaryOptions: restaurant.dietaryOptions,
    orderingEnabled: restaurant.orderingEnabled,
  }
}

/** The menu tree as the page renders it: names in both languages, every dish serialized with the restaurant's `offered` dietary options. */
export function serializeCategories(categories: CategoryTree[], offered?: readonly string[]): MenuCategory[] {
  return categories.map((cat) => ({
    id: cat.id,
    nameEn: cat.nameEn,
    nameFr: cat.nameFr,
    subcategories: cat.subcategories.map((sub) => ({
      id: sub.id,
      nameEn: sub.nameEn,
      nameFr: sub.nameFr,
      dishes: sub.dishes.map((dish) => serializeDish(dish, offered)),
    })),
  }))
}

/** The absolute origin for share links, JSON-LD and metadata: the public app URL from lib/env, not the request host, so it is the same on every render. */
export function siteOrigin(): string {
  return publicEnv.appUrl
}
