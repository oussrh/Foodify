// lib/schemas/dish.ts
// A dish and its ingredients. Dietary attributes and allergens are the keys of lib/menu.ts's
// vocabularies: the menu renders a label per key and nothing else is storable.
import { z } from 'zod'
import { ALLERGEN_OPTIONS, DIETARY_OPTIONS } from '@/lib/menu'
import { bilingualName, money, uuid } from './common'

// Typed as strings, as the rows and the picker are; the vocabulary is the runtime rule.
const keyOf = (options: readonly { key: string }[], what: string) =>
  z.string().refine((k) => options.some((o) => o.key === k), `Unknown ${what}`)
const dietaryKey = keyOf(DIETARY_OPTIONS, 'dietary attribute')
const allergenKey = keyOf(ALLERGEN_OPTIONS, 'allergen')

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
/** A whole dish as the create form submits and the create action parses; `price` is already normalised to two fraction digits. */
export type DishInput = z.infer<typeof dishInput>
/** Any subset of the dish fields plus `isActive`; what the edit form submits and the update action parses. */
export type DishPatch = z.infer<typeof dishPatch>

/** A new ingredient is its two names and nothing else; the dish comes from the action's argument, guarded there. */
export const ingredientInput = bilingualName
/** Either name of an ingredient, or both; an ingredient cannot be moved to another dish. */
export const ingredientPatch = bilingualName.partial()
/** Both names of a new ingredient, as the ingredient form submits them. */
export type IngredientInput = z.infer<typeof ingredientInput>
/** Either name of an ingredient, as an edit submits it. */
export type IngredientPatch = z.infer<typeof ingredientPatch>
