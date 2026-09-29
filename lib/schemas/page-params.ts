// lib/schemas/page-params.ts
// What a server-rendered page reads from its URL: the dynamic segments (`[id]`, `[slug]`) and
// the query. A segment that does not parse is a 404 before it reaches a guard or Prisma; a
// query value that does not parse is dropped, because a stale or hand-edited link should still
// open the page. Next hands a query value as a string, an array (the key repeated) or undefined.
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { GRAINS } from '@/lib/insights'
import { uuid } from './common'
import { orderTable } from './order'
import { slug } from './restaurant'
import { restaurantRef } from './staff-app'

/** A page's query as Next hands it, before any of it is parsed. */
export type SearchParams = Record<string, string | string[] | undefined>

/** A page's dynamic segments (its awaited `params`) through `schema`, or the route's 404 when they do not parse. */
export function routeParams<T>(schema: z.ZodType<T>, segments: unknown): T {
  const parsed = schema.safeParse(segments)
  if (!parsed.success) notFound()
  return parsed.data
}

/** The portals' `[id]` segment for a user or an admin row, by uuid. */
export const idSegment = z.object({ id: uuid })
/**
 * A restaurant's `[id]` segment, in the portals (`restaurants/[id]/…`, `orders/[id]`) as on the
 * devices: its six-character code as typed, parsed to the stored code, or the uuid an older link
 * carried (`restaurantRef`). Anything else is the route's 404.
 */
export const restaurantSegment = z.object({ id: restaurantRef })
/** The portals' `restaurants/[id]/dishes/[dishId]` segments: the restaurant (`restaurantSegment`) and the dish's uuid. */
export const dishSegments = restaurantSegment.extend({ dishId: uuid })
/** The public menu's `[slug]` segment, by the rule a stored slug met. */
export const menuSegment = z.object({ slug })
/** The public dish page's `[slug]/dish/[dishId]` segments. */
export const menuDishSegments = menuSegment.extend({ dishId: uuid })

// The first value of a repeated key, as URLSearchParams.get reads it.
const first = (value: unknown) => (Array.isArray(value) ? value[0] : value)

/** The `?search` of a list page: the first value, trimmed; '' when absent or over 100 characters. */
export const listSearch = z.preprocess(first, z.string().trim().max(100)).catch('')

/** The `?grain` of the Insights tab: one of `GRAINS`, daily for anything else rather than a failed page. */
export const grainParam = z.preprocess(first, z.enum(GRAINS)).catch('day')

/**
 * The public menu's query. `lang` (en or fr) and `filter` (only `ar`, the AR-dishes shortcut)
 * take the first value; `table` is the one from the table's own QR code, which locks the
 * checkout's table field, so anything but a single valid table number is no table at all.
 */
export const menuQuery = z.object({
  lang: z.preprocess(first, z.enum(['en', 'fr']).optional()).catch(undefined),
  filter: z.preprocess(first, z.literal('ar').optional()).catch(undefined),
  table: orderTable.optional().catch(undefined),
})
