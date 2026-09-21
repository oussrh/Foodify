import prisma from '@/lib/prisma'
import { ok, fail } from '@/lib/api'
import { authErrorResponse, requireSuperAdmin } from '@/lib/auth-guard'
import { afterCursor, listParams, listQuery, page, pageArgs } from '@/lib/schemas/list'

/**
 * GET, super admin only (401 or 403 in the envelope). Query `limit` 1..500 (default 100) and an opaque `cursor`: a bad
 * limit or an empty cursor is 400 invalid_query, a foreign cursor restarts the list. Answers `{ data: [{ id, name, slug }],
 * meta: { next } }` in name order, `next` the following page's cursor or null; the assign-restaurants dialog follows it to the end.
 */
export async function GET(request: Request) {
  try {
    await requireSuperAdmin()
  } catch (error) {
    return authErrorResponse(error)
  }
  const query = listQuery.safeParse(listParams(new URL(request.url).searchParams))
  if (!query.success) return fail('invalid_query', 'limit is 1..500 and cursor an id', 400)

  const rows = await prisma.restaurant.findMany({
    where: afterCursor('name', query.data.cursor),
    select: { id: true, name: true, slug: true },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    ...pageArgs(query.data),
  })
  const { data, next } = page(rows, query.data.limit, 'name')
  return ok(data, { meta: { next } })
}
