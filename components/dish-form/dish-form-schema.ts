// components/dish-form/dish-form-schema.ts
// What both dish forms validate with and what they send. The fields are checked with `dishInput`'s
// own rules (the category select's '' is its one addition, read as no category); the payload,
// which adds the uploaded asset URLs the fields never held, is parsed again with the action's
// schema before it leaves, so an asset address the action would refuse is named, not a failure.
import { z } from 'zod'
import { dishInput } from '@/lib/schemas/dish'
import type { DishAssetUrls } from './use-dish-assets'

/** The calories box as the schema reads it: empty is no figure, not NaN (which would refuse a dish saved without one). */
export const caloriesValue = (raw: unknown) => (raw === '' || raw === null || raw === undefined ? undefined : Number(raw))

/**
 * The fields' rules: `dishInput`'s, with the category select's '' (no category) allowed beside a
 * uuid. The asset URLs have no visible field, so they are not checked here, where a refusal would
 * have nowhere to show: the payload's parse checks them and the form toasts its message.
 */
export const dishFormSchema = dishInput.extend({
  subcategoryId: dishInput.shape.subcategoryId.or(z.literal('')),
  imageUrl: z.string().optional(),
  usdzUrl: z.string().optional(),
  glbUrl: z.string().optional(),
})

/** The form's values; an optional member may be absent or `undefined`. */
export type DishFormValues = {
  nameEn: string
  nameFr: string
  descriptionEn?: string | undefined
  descriptionFr?: string | undefined
  price: string
  imageUrl?: string | undefined
  usdzUrl?: string | undefined
  glbUrl?: string | undefined
  subcategoryId?: string | null | undefined
  calories?: number | null | undefined
  isMostPurchased?: boolean | undefined
  dietary?: string[] | undefined
  allergens?: string[] | undefined
}

/**
 * What a dish form sends: the fields, the asset URLs the uploads hold (`imageUrl` already resolved
 * by the caller), no category and no calories as null (so clearing them clears them), and the
 * optional flags and lists given their empty defaults.
 */
export function dishPayload(data: DishFormValues, assets: DishAssetUrls) {
  return {
    nameEn: data.nameEn,
    nameFr: data.nameFr,
    descriptionEn: data.descriptionEn,
    descriptionFr: data.descriptionFr,
    price: data.price,
    calories: data.calories ?? null,
    imageUrl: assets.imageUrl || '',
    subcategoryId: data.subcategoryId || null,
    usdzUrl: assets.usdzUrl || '',
    glbUrl: assets.glbUrl || '',
    isMostPurchased: data.isMostPurchased || false,
    dietary: data.dietary || [],
    allergens: data.allergens || [],
  }
}
