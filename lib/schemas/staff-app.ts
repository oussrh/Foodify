// lib/schemas/staff-app.ts
// How a staff app's links name a restaurant, and the query of the manifest that makes each app
// installable (GET /orders/manifest). The device links carry the short code; a link saved before
// codes existed carries the uuid, and both must keep opening the same restaurant.
import { z } from 'zod'
import { parseRestaurantCode } from '@/lib/restaurant-code'
import { uuid } from './common'

/**
 * A restaurant as a device link names it: its six-character code as typed (folded onto the
 * alphabet by `parseRestaurantCode`, so `k7m2qx` reads as `K7M2QX`), or its uuid. Parses to the
 * stored code or the uuid, and `isRestaurantCode` tells which; anything else is refused.
 */
export const restaurantRef = z.union([uuid, z.string().transform(parseRestaurantCode).pipe(z.string())])

/** The staff apps that can be installed, each with a manifest of its own. */
export const STAFF_APPS = ['admin', 'manager', 'kitchen', 'waiter'] as const

/** The manifest's query: the restaurant (`restaurantRef`) and which staff app it is for. */
export const staffManifestQuery = z.object({ id: restaurantRef, portal: z.enum(STAFF_APPS) })
