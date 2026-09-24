import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api'
import { authErrorResponse, requireSuperAdmin } from '@/lib/auth-guard'
import { afterCursor, listParams, page, pageArgs } from '@/lib/schemas/list'
import { userListQuery } from '@/lib/schemas/user'

/**
 * GET, super admin only (401 or 403 in the envelope). Query `role` (SUPER_ADMIN or RESTAURANT_ADMIN, absent for no filter), `limit`
 * 1..500 (default 100) and an opaque `cursor` — any other role, a bad limit or an empty cursor is 400 invalid_query, a foreign cursor restarts
 * the list. Answers `{ data: [{ id, email, role }], meta: { next } }` in email order, never a secret column; the assign-users dialog follows `next`.
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()
  } catch (error) {
    return authErrorResponse(error)
  }
  const params = request.nextUrl.searchParams
  const query = userListQuery.safeParse({ ...listParams(params), role: params.get('role') ?? undefined })
  if (!query.success) return fail('invalid_query', 'role is SUPER_ADMIN or RESTAURANT_ADMIN, limit 1..500 and cursor an id', 400)
  const { role } = query.data

  const rows = await prisma.user.findMany({
    where: { ...(role ? { role } : {}), ...afterCursor('email', query.data.cursor) },
    select: { id: true, email: true, role: true },
    orderBy: [{ email: 'asc' }, { id: 'asc' }],
    ...pageArgs(query.data),
  })
  const { data, next } = page(rows, query.data.limit, 'email')
  return ok(data, { meta: { next } })
}
