import prisma from '@/lib/prisma'
import { ok, fail } from '@/lib/api'
import { authErrorResponse, requireBoardAccess } from '@/lib/auth-guard'
import { boardOrderSelect, serializeOrder } from '@/lib/order-data'
import { type BoardOrder, isClosed, OPEN_STATUSES, type OrderStatus } from '@/lib/orders'
import { orderBoardQuery } from '@/lib/schemas/order-board'

/** At most this many orders in one answer: a board shows what a kitchen can hold, and the poll stays small. */
const MAX_ORDERS = 100

/**
 * Which end of the day an answer starts from. The orders being worked read oldest first, so the
 * longest wait is at the top of the board; the ones already finished read newest first, because
 * "what did we just send out" is the question a served list answers. No date arithmetic decides
 * it: the list is simply capped, so nothing depends on where a calendar day is cut.
 */
function newestFirst(statuses: readonly OrderStatus[]): boolean {
  return statuses.every(isClosed)
}

/**
 * GET, the restaurant's own staff and its kitchen tablets (401 or 403 in the envelope): the orders the board polls. Query `restaurantId`
 * and optional repeated `status` (the open ones, NEW and ACCEPTED, when absent); anything else is 400 invalid_query.
 * Answers `{ data: BoardOrder[] }`, at most a hundred: the ones being worked oldest first, so the longest wait is at the
 * top, and a list of finished ones newest first. The list is bounded rather than paged: a board that needs a second page
 * is a kitchen in trouble, not a UI to scroll, and the served list answers "what did we just send out", not "all of it".
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const query = orderBoardQuery.safeParse({
    restaurantId: params.get('restaurantId') ?? undefined,
    status: params.getAll('status').length > 0 ? params.getAll('status') : undefined,
  })
  if (!query.success) return fail('invalid_query', 'restaurantId is a uuid and status one of the order statuses', 400)

  try {
    await requireBoardAccess(query.data.restaurantId)
  } catch (error) {
    return authErrorResponse(error)
  }

  const statuses = query.data.status ?? [...OPEN_STATUSES]
  const recent = newestFirst(statuses)
  const rows = await prisma.order.findMany({
    where: { restaurantId: query.data.restaurantId, status: { in: statuses } },
    orderBy: recent ? [{ updatedAt: 'desc' }, { id: 'desc' }] : [{ createdAt: 'asc' }, { id: 'asc' }],
    take: MAX_ORDERS,
    select: boardOrderSelect,
  })

  const data: BoardOrder[] = rows.map(serializeOrder)
  return ok(data)
}
