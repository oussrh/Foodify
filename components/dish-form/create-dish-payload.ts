// components/dish-form/create-dish-payload.ts
// What the create form sends to createDish: the typed values with the uploaded asset URLs
// taking precedence over the hidden field, the parsed calories, and the optional lists and
// flags given their empty defaults.
import type { DishAssetUrls } from './use-dish-assets'

/** The create form's values: the dish rules, with calories as the text it is typed in. */
export type CreateDishValues = {
  nameEn: string
  nameFr: string
  descriptionEn?: string
  descriptionFr?: string
  price: string
  imageUrl: string
  subcategoryId?: string
  calories?: string
  isMostPurchased?: boolean
  dietary?: string[]
  allergens?: string[]
}

export function createDishPayload(data: CreateDishValues, calories: number | undefined, assets: DishAssetUrls) {
  return {
    nameEn: data.nameEn,
    nameFr: data.nameFr,
    descriptionEn: data.descriptionEn,
    descriptionFr: data.descriptionFr,
    price: data.price,
    calories: calories,
    imageUrl: assets.imageUrl || data.imageUrl,
    subcategoryId: data.subcategoryId || null,
    usdzUrl: assets.usdzUrl || '',
    glbUrl: assets.glbUrl || '',
    isMostPurchased: data.isMostPurchased || false,
    dietary: data.dietary || [],
    allergens: data.allergens || [],
  }
}
