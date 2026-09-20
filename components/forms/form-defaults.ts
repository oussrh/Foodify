// components/forms/form-defaults.ts
// Rows as the edit forms' default values: every nullable column as '' (the inputs are
// controlled), an enum narrowed to what the form offers, money as the two-decimal string.
import type { Dish, Restaurant } from '@/generated/prisma/client'
import type { EditDishValues } from '@/components/edit-dish-form'
import type { EditRestaurantValues } from '@/components/edit-restaurant-form'

// The nullable text columns the settings form edits, '' when unset; the rest are named below.
const TEXT_COLUMNS = [
  'email', 'phone', 'tagline', 'logoUrl', 'colorTheme',
  'streetAddress', 'city', 'state', 'postalCode', 'country', 'website',
  'description', 'cuisineType', 'openingHours', 'socialMedia',
  'coverImageUrl', 'secondaryColor', 'fontFamily', 'googleFontUrl',
  'currency', 'currencySymbol',
] as const satisfies readonly (keyof Restaurant)[]
type TextColumn = (typeof TEXT_COLUMNS)[number]

function textColumns(restaurant: Restaurant): Record<TextColumn, string> {
  const out = {} as Record<TextColumn, string>
  for (const key of TEXT_COLUMNS) out[key] = restaurant[key] ?? ''
  return out
}

/** A restaurant row as the settings form's default values: every nullable text column as '' (the inputs are controlled), the enums narrowed to what the form offers. */
export function restaurantFormValues(restaurant: Restaurant): EditRestaurantValues {
  return {
    name: restaurant.name,
    slug: restaurant.slug,
    defaultLocale: restaurant.defaultLocale,
    ...textColumns(restaurant),
    priceRange: restaurant.priceRange as '$' | '$$' | '$$$' | '$$$$' | undefined,
    coverImageStyle: restaurant.coverImageStyle as 'cover' | 'repeat' | undefined,
    menuTheme: (['light', 'dark'].includes(restaurant.menuTheme) ? restaurant.menuTheme : 'system') as 'system' | 'light' | 'dark',
  }
}

/** A dish row as the edit form's default values: money as the two-decimal string, the assets as '' when unset. */
export function dishFormValues(dish: Dish): EditDishValues {
  return {
    nameEn: dish.nameEn,
    nameFr: dish.nameFr,
    descriptionEn: dish.descriptionEn,
    descriptionFr: dish.descriptionFr,
    price: dish.price.toFixed(2),
    imageUrl: dish.imageUrl,
    usdzUrl: dish.usdzUrl || '',
    glbUrl: dish.glbUrl || '',
    subcategoryId: dish.subcategoryId || '',
    calories: dish.calories || undefined,
    isMostPurchased: dish.isMostPurchased || false,
    dietary: dish.dietary ?? [],
    allergens: dish.allergens ?? [],
  }
}
