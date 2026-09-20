// lib/menu-data.ts
// Serializers from Prisma rows to the plain shapes the customer pages render.
import type { Dish, Ingredient, Restaurant } from '@prisma/client'
import type { CoverStyle, Locale, MenuDish, MenuRestaurant, MenuTheme } from './menu'

export function serializeDish(dish: Dish & { ingredients: Ingredient[] }): MenuDish {
  return {
    id: dish.id,
    nameEn: dish.nameEn,
    nameFr: dish.nameFr,
    descriptionEn: dish.descriptionEn || null,
    descriptionFr: dish.descriptionFr || null,
    price: Number(dish.price),
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

export function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://foodify.app'
}
