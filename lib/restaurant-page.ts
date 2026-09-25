// lib/restaurant-page.ts
// How a portal's restaurant page (`/{admin,manager}/restaurants/[id]/…`) reads its segment. The
// links name a restaurant by its short code; a bookmark or an old tab may still carry its uuid,
// or a code typed in lower case. Each page has one address, so any other spelling of it is a
// permanent redirect to the code, and the loaders and actions behind the page go on working
// with the uuid, resolved here once.
import type { Route } from 'next'
import { permanentRedirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { restaurantWhere } from '@/lib/restaurant-code'
import { mayOpen } from '@/lib/restaurant-loader'
import { restaurantSegment, routeParams } from '@/lib/schemas/page-params'

/**
 * The uuid of the restaurant a portal page's `[id]` segment names. A segment that is neither a
 * code nor a uuid is the route's 404 (`restaurantSegment`). A restaurant this reader may manage,
 * reached by anything but its code exactly as stored, is a 308 to `canonical(code)`: the page's
 * own address, query included. Otherwise the reference comes back as it was parsed: an unknown
 * code is no restaurant's id, so a well-formed code that matches nothing meets the page's own
 * lookup and its own answer exactly as an unknown uuid does, and a reader who may not open the
 * restaurant is never told its code. The access check runs whether or not a row was found, so a
 * miss costs what a hit does and the time taken says nothing about which codes are real.
 */
export async function restaurantPageId(segment: string, canonical: (code: string) => Route): Promise<string> {
  const ref = routeParams(restaurantSegment, { id: segment }).id
  const row = await prisma.restaurant.findUnique({ where: restaurantWhere(ref), select: { id: true, code: true } })
  const allowed = await mayOpen(row?.id ?? ref)
  if (!row) return ref
  if (allowed && segment !== row.code) permanentRedirect(canonical(row.code))
  return row.id
}
