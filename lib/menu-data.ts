// lib/menu-data.ts
// Serializers from Prisma rows to the plain shapes the customer pages render.
import type { Dish, Ingredient, MenuCategory as CategoryRow, MenuSubcategory as SubcategoryRow, Restaurant } from '@/generated/prisma/client'
import { publicEnv } from '@/lib/env'
import type { CoverStyle, Locale, MenuCategory, MenuDish, MenuRestaurant, MenuTheme } from './menu'

type DishRow = Dish & { ingredients: Ingredient[] }
type CategoryTree = CategoryRow & { subcategories: (SubcategoryRow & { dishes: DishRow[] })[] }

export function serializeDish(dish: DishRow): MenuDish {
  return {
    id: dish.id,
    nameEn: dish.nameEn,
    nameFr: dish.nameFr,
    descriptionEn: dish.descriptionEn || null,
    descriptionFr: dish.descriptionFr || null,
    price: dish.price.toFixed(2),
    imageUrl: dish.imageUrl,
    usdzUrl: dish.usdzUrl || null,
    glbUrl: dish.glbUrl || null,
    calories: dish.calories ?? null,
    isMostPurchased: dish.isMostPurchased,
    dietary: dish.dietary ?? [],
    allergens: dish.allergens ?? [],
    ingredients: dish.ingredients.map((i) => ({ id: i.id, nameEn: i.nameEn, nameFr: i.nameFr })),
  }
}

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
  }
}

/** The menu tree as the page renders it: names in both languages, every dish serialized. */
export function serializeCategories(categories: CategoryTree[]): MenuCategory[] {
  return categories.map((cat) => ({
    id: cat.id,
    nameEn: cat.nameEn,
    nameFr: cat.nameFr,
    subcategories: cat.subcategories.map((sub) => ({
      id: sub.id,
      nameEn: sub.nameEn,
      nameFr: sub.nameFr,
      dishes: sub.dishes.map(serializeDish),
    })),
  }))
}

export function siteOrigin(): string {
  return publicEnv.appUrl
}
