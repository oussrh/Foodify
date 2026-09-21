import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, fail } from '@/lib/api'
import { authErrorResponse, requireSuperAdmin } from '@/lib/auth-guard'
import { afterCursor, listParams, listQuery, page, pageArgs } from '@/lib/schemas/list'

// An unknown or absent role filters nothing, as before.
const roleFilter = z.enum(['SUPER_ADMIN', 'RESTAURANT_ADMIN']).optional().catch(undefined)

/**
 * GET, super admin only (401 or 403 in the envelope). Query `role` (SUPER_ADMIN or RESTAURANT_ADMIN, else no filter), `limit`
 * 1..500 (default 100) and an opaque `cursor`: a bad limit or an empty cursor is 400 invalid_query, a foreign cursor restarts
 * the list. Answers `{ data: [{ id, email, role }], meta: { next } }` in email order, never a secret column; the assign-users dialog follows `next`.
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()
  } catch (error) {
    return authErrorResponse(error)
  }
  const role = roleFilter.parse(request.nextUrl.searchParams.get('role') ?? undefined)
  const query = listQuery.safeParse(listParams(request.nextUrl.searchParams))
  if (!query.success) return fail('invalid_query', 'limit is 1..500 and cursor an id', 400)

  const rows = await prisma.user.findMany({
    where: { ...(role ? { role } : {}), ...afterCursor('email', query.data.cursor) },
    select: { id: true, email: true, role: true },
    orderBy: [{ email: 'asc' }, { id: 'asc' }],
    ...pageArgs(query.data),
  })
  const { data, next } = page(rows, query.data.limit, 'email')
  return ok(data, { meta: { next } })
}
