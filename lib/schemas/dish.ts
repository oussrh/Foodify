// lib/schemas/dish.ts
// A dish and its ingredients. Dietary attributes and allergens are the keys of lib/menu.ts's
// vocabularies: the menu renders a label per key and nothing else is storable.
import { z } from 'zod'
import { ALLERGEN_OPTIONS, DIETARY_OPTIONS } from '@/lib/menu'
import { bilingualName, uuid } from './common'

// Typed as strings, as the rows and the picker are; the vocabulary is the runtime rule.
const keyOf = (options: readonly { key: string }[], what: string) =>
  z.string().refine((k) => options.some((o) => o.key === k), `Unknown ${what}`)
const dietaryKey = keyOf(DIETARY_OPTIONS, 'dietary attribute')
const allergenKey = keyOf(ALLERGEN_OPTIONS, 'allergen')

export const dishInput = bilingualName.extend({
  descriptionEn: z.string().optional(),
  descriptionFr: z.string().optional(),
  price: z.number().min(0, 'Price must be a valid number greater than 0'),
  imageUrl: z.string().min(1, 'Image URL is required'),
  usdzUrl: z.string().optional(),
  glbUrl: z.string().optional(),
  subcategoryId: uuid.nullable().optional(),
  calories: z.number().int().nullable().optional(),
  isMostPurchased: z.boolean().optional(),
  dietary: z.array(dietaryKey).optional(),
  allergens: z.array(allergenKey).optional(),
})
export const dishPatch = dishInput.partial().extend({ isActive: z.boolean().optional() })
export type DishInput = z.infer<typeof dishInput>
export type DishPatch = z.infer<typeof dishPatch>

export const ingredientInput = bilingualName
export const ingredientPatch = bilingualName.partial()
export type IngredientInput = z.infer<typeof ingredientInput>
export type IngredientPatch = z.infer<typeof ingredientPatch>
