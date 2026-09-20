// lib/schemas/list.ts
// Every list of the admin API is bounded and followable (API.1): `limit` caps a page, `cursor`
// is the id of the last row seen, and the response's `meta.next` carries the cursor of the next
// page or null. Sorting ends on `id` so a cursor is unambiguous.
import { z } from 'zod'
import { uuid } from './common'

export const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  cursor: uuid.optional(),
})
export type ListQuery = z.infer<typeof listQuery>

/** The list parameters of a request as the handler parses them, an absent one absent rather than the string "null". */
export function listParams(searchParams: URLSearchParams) {
  return { limit: searchParams.get('limit') ?? undefined, cursor: searchParams.get('cursor') ?? undefined }
}

/** Prisma's cursor arguments for a page: one row more than the limit tells whether a next page exists. */
export function pageArgs({ limit, cursor }: ListQuery) {
  return { take: limit + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) }
}

/** The page and its `next` cursor from the rows `pageArgs` fetched. */
export function page<T extends { id: string }>(rows: T[], limit: number): { data: T[]; next: string | null } {
  const data = rows.slice(0, limit)
  return { data, next: rows.length > limit ? data[data.length - 1].id : null }
}
