// lib/schemas/tracking.ts
// The two beacons the guest menu sends with no session (POST /api/dish-views, POST
// /api/cart-adds). The handlers parse the body strictly and read the restaurant off the dish,
// never off the caller; the menu can import the same shapes, since this module is shared.
import { z } from 'zod'
import { uuid } from './common'

/** A guest opened a dish, or launched it in AR: the dish, whether AR was used (false when absent) and the device as the view table names it (`Other` when absent). */
export const dishView = z.object({
  dishId: uuid,
  arViewed: z.boolean().default(false),
  deviceType: z.enum(['iOS', 'Android', 'Other']).default('Other'),
})

/** A guest put a dish in their order: the dish alone, the restaurant is read from it. */
export const cartAdd = z.object({ dishId: uuid })
