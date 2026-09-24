import { ok, fail } from '@/lib/api'
import { authErrorResponse, requireOrderingStaff } from '@/lib/auth-guard'
import { tableTabQuery } from '@/lib/schemas/order'
import { loadTableTab } from '@/lib/table-tab-loader'

/**
 * GET, the staff who may order at a table (a waiter, a manager, a super admin; 401 or 403 in the
 * envelope, a kitchen tablet refused): the table's current bill. Query `restaurantId` and `table`;
 * anything else is 400 invalid_query. Answers `{ data: TableTab | null }`: the order that opened
 * the table in the last twelve hours and was not cancelled, every addition sent to it oldest
 * first, and the whole bill's total (lib/table-tab.ts); null when the table has no bill open.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const query = tableTabQuery.safeParse({ restaurantId: params.get('restaurantId') ?? undefined, table: params.get('table') ?? undefined })
  if (!query.success) return fail('invalid_query', 'restaurantId is a uuid and table a table number', 400)

  try {
    await requireOrderingStaff(query.data.restaurantId)
  } catch (error) {
    return authErrorResponse(error)
  }

  return ok(await loadTableTab(query.data.restaurantId, query.data.table))
}
