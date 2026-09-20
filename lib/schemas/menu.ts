// lib/schemas/menu.ts
// Categories and subcategories of a restaurant's menu.
import { z } from 'zod'
import { bilingualName, uuid } from './common'

export const categoryInput = bilingualName
export const categoryPatch = bilingualName.partial().extend({ isActive: z.boolean().optional() })
export type CategoryInput = z.infer<typeof categoryInput>
export type CategoryPatch = z.infer<typeof categoryPatch>
/** The ids of one parent's children in their new order. */
export const order = z.array(uuid)
