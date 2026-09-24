// lib/schemas/dish.ts
// A dish and its ingredients. Dietary attributes and allergens are the keys of lib/menu.ts's
// vocabularies: the menu renders a label per key and nothing else is storable.
import { z } from 'zod'
import { MAX_TEXT, allergenKey, bilingualName, dietaryKey, money, shortText, uuid } from './common'

/**
 * A dish's image or AR model as a form sends it: '' (none), a path on this site ('/ar/…', never
 * '//host', which a browser reads as another site), or an https address — a Cloudinary one is stored
 * as it is, any other is fetched into the restaurant's folder by the action.
 */
const assetUrl = z
  .string()
  .refine((v) => v === '' || /^\/(?!\/)/.test(v) || z.url({ protocol: /^https$/ }).safeParse(v).success, 'An https:// address or a path on this site')

/**
 * What the create form submits and createDish parses. `price` is `money` (a decimal string, never a
 * float); `dietary` and `allergens` are keys of the menu vocabularies, so a key the picker does not
 * know cannot be stored; `subcategoryId` is only checked to be a UUID here: that it belongs to the
 * dish's restaurant is the action's guard (`requireSubcategoryOf`), not the schema's.
 */
export const dishInput = bilingualName.extend({
  descriptionEn: shortText(MAX_TEXT),
  descriptionFr: shortText(MAX_TEXT),
  price: money,
  imageUrl: assetUrl,
  usdzUrl: assetUrl.optional(),
  glbUrl: assetUrl.optional(),
  subcategoryId: uuid.nullable().optional(),
  calories: z.number().int().min(0, 'Calories cannot be negative').max(20000, 'That is more calories than a dish holds').nullable().optional(),
  isMostPurchased: z.boolean().optional(),
  dietary: z.array(dietaryKey).optional(),
  allergens: z.array(allergenKey).optional(),
})
/** Any subset of `dishInput` plus `isActive`; a field left out is left as it was (`definedFields` at the write). */
export const dishPatch = dishInput.partial().extend({ isActive: z.boolean().optional() })
/** `dishInput` after parsing: `price` is already the two-fraction-digit string `money` produces. */
export type DishInput = z.infer<typeof dishInput>
/** `dishPatch` after parsing. */
export type DishPatch = z.infer<typeof dishPatch>

/** A new ingredient is its two names and nothing else; the dish comes from the action's argument, guarded there. */
export const ingredientInput = bilingualName
/** Either name of an ingredient, or both; an ingredient cannot be moved to another dish. */
export const ingredientPatch = bilingualName.partial()
/** `ingredientInput` after parsing. */
export type IngredientInput = z.infer<typeof ingredientInput>
/** `ingredientPatch` after parsing. */
export type IngredientPatch = z.infer<typeof ingredientPatch>
