// lib/schemas/dish.ts
// A dish and its ingredients. Dietary attributes and allergens are the keys of lib/menu.ts's
// vocabularies: the menu renders a label per key and nothing else is storable.
import { z } from 'zod'
import { allergenKey, bilingualName, dietaryKey, money, uuid } from './common'

/**
 * What the create form submits and createDish parses. `price` is `money` (a decimal string, never a
 * float); `dietary` and `allergens` are keys of the menu vocabularies, so a key the picker does not
 * know cannot be stored; `subcategoryId` is only checked to be a UUID here: that it belongs to the
 * dish's restaurant is the action's guard (`requireSubcategoryOf`), not the schema's.
 */
export const dishInput = bilingualName.extend({
  descriptionEn: z.string().optional(),
  descriptionFr: z.string().optional(),
  price: money,
  imageUrl: z.string().min(1, 'Image URL is required'),
  usdzUrl: z.string().optional(),
  glbUrl: z.string().optional(),
  subcategoryId: uuid.nullable().optional(),
  calories: z.number().int().nullable().optional(),
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
