import prisma from '@/lib/prisma'
import { ok, fail } from '@/lib/api'
import { authErrorResponse, requireSuperAdmin } from '@/lib/auth-guard'
import { listParams, listQuery, page, pageArgs } from '@/lib/schemas/list'

// Used by the assign-restaurants dialog, which follows meta.next until the list is complete.
export async function GET(request: Request) {
  try {
    await requireSuperAdmin()
  } catch (error) {
    return authErrorResponse(error)
  }
  const query = listQuery.safeParse(listParams(new URL(request.url).searchParams))
  if (!query.success) return fail('invalid_query', 'limit is 1..500 and cursor an id', 400)

  const rows = await prisma.restaurant.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    ...pageArgs(query.data),
  })
  const { data, next } = page(rows, query.data.limit)
  return ok(data, { next })
}
