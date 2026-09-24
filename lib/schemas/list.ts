// lib/schemas/list.ts
// Every list of the admin API is bounded and followable (API.1): `limit` caps a page, `cursor`
// is an opaque key of the last row seen (its sort value and its id), and the response's
// `meta.next` carries the cursor of the next page or null. The page is a keyset `where` on
// (sort value, id), not Prisma's `cursor`: that one looks the cursor row up by id alone, so a
// cursor from outside the filter skipped the first row of a page and a deleted row ended the
// list early. Sorting ends on `id` so a key is unambiguous.
import { z } from 'zod'

/** The query of every admin list: `limit` 1..500 (100 when absent; a page of 500 is the most one request may hold) and an optional non-empty `cursor` from a previous page's `meta.next`. */
export const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  cursor: z.string().min(1).optional(),
})
/** `listQuery` after parsing: `limit` is always present (100 by default), `cursor` only when the client sent one. */
export type ListQuery = z.infer<typeof listQuery>

/** The list parameters of a request as the handler parses them, an absent one absent rather than the string "null". */
export function listParams(searchParams: URLSearchParams) {
  return { limit: searchParams.get('limit') ?? undefined, cursor: searchParams.get('cursor') ?? undefined }
}

type Key = { sort: string; id: string }

/** The opaque cursor of a row: its sort value and id, base64url so any text is safe in a query. */
export function encodeCursor(key: Key): string {
  return Buffer.from(JSON.stringify([key.sort, key.id]), 'utf8').toString('base64url')
}

/** A cursor's decoded JSON as `encodeCursor` writes it: the pair [sort value, id], both strings. */
const cursorKey = z.tuple([z.string(), z.string()]).transform(([sort, id]): Key => ({ sort, id }))

/** The key inside a cursor, or null for anything that is not one this module wrote. */
export function decodeCursor(cursor: string): Key | null {
  let json: unknown
  try {
    json = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
  } catch {
    return null // not JSON, so not a cursor of ours
  }
  const key = cursorKey.safeParse(json)
  return key.success ? key.data : null
}

/** Prisma's `take` for a page: one row more than the limit tells whether a next page exists. */
export function pageArgs({ limit }: ListQuery) {
  return { take: limit + 1 }
}

/** The rows after the cursor in (field asc, id asc) order, as a `where` to AND with the handler's own. */
export function afterCursor(field: string, cursor: string | undefined) {
  const key = cursor ? decodeCursor(cursor) : null
  if (!key) return {}
  return { OR: [{ [field]: { gt: key.sort } }, { [field]: key.sort, id: { gt: key.id } }] }
}

/** The page and its `next` cursor from the rows `pageArgs` fetched, sorted on `field` then id. */
export function page<F extends string, T extends { id: string } & Record<F, string>>(rows: T[], limit: number, field: F): { data: T[]; next: string | null } {
  const data = rows.slice(0, limit)
  const last = data[data.length - 1]
  return { data, next: rows.length > limit && last ? encodeCursor({ sort: last[field], id: last.id }) : null }
}
