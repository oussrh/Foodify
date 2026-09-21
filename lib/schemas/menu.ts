// lib/schemas/menu.ts
// Categories and subcategories of a restaurant's menu.
import { z } from 'zod'
import { bilingualName, uuid } from './common'

/** A new category or subcategory is its two names; the parent (restaurant or category) is the action's argument, guarded there. */
export const categoryInput = bilingualName
/** Either name and/or `isActive` of a category or subcategory; `sortOrder` changes only through a reorder (`order`), never here. */
export const categoryPatch = bilingualName.partial().extend({ isActive: z.boolean().optional() })
/** Both names of a new category or subcategory; the same shape serves both levels. */
export type CategoryInput = z.infer<typeof categoryInput>
/** Either name and/or `isActive` of a category or subcategory, as an edit submits it. */
export type CategoryPatch = z.infer<typeof categoryPatch>
/** The ids of one parent's children in their new order. */
export const order = z.array(uuid)
