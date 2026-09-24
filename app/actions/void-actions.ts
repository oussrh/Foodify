// app/actions/void-actions.ts
// A manager's side of a sent order: voiding a dish, or a whole ticket, that has already left the
// kitchen (the floor cannot: lib/bill-rules.ts), and reading the order's change log. A void is
// applied at once, recorded with its reason, and leaves the line on record; the total drops.
'use server'

import { requireRestaurantAccess } from '@/lib/auth-guard'
import type { ChangeLogEntry } from '@/lib/change-log'
import { changeLogQuery, lineChange, ticketChange, type ChangeLogQuery, type LineChange, type TicketChange } from '@/lib/schemas/order-changes'
import { afterResponse } from '@/server/after-response'
import { pushChangeAnswers } from '@/server/change-push'
import { loadChangeLog } from '@/server/change-log'
import { lineOwner, orderRestaurant } from '@/server/order-owner'
import { changeTicket, type TicketChangeResult } from '@/server/ticket-changes'

/** A void that cancelled its ticket answered the requests still open on it: their waiters are told. */
function told(result: TicketChangeResult): TicketChangeResult {
  if (result.ok && result.answered.length > 0) afterResponse(() => pushChangeAnswers(result.answered))
  return result
}

/**
 * A manager of the ticket's own restaurant, or a super admin (a waiter and a tablet are refused
 * by the guard). Parses `ticketChange` and voids the whole ticket once it is ready or served (before
 * that a manager cancels it like the floor), closed bill or not:
 * every line is taken off, the subtotal falls to zero and the ticket is cancelled, with the void
 * and its reason on record. Answers `TicketChangeResult`.
 */
export async function voidTicket(raw: TicketChange): Promise<TicketChangeResult> {
  const input = ticketChange.parse(raw)
  const actor = await requireRestaurantAccess({ id: await orderRestaurant(input.orderId) })
  return told(await changeTicket({ orderId: input.orderId, lineId: null, quantity: null, reason: input.reason, note: input.note || null }, actor, 'void'))
}

/**
 * The same people as `voidTicket`, on one line: parses `lineChange` and voids `quantity` portions
 * of it. The line stays, the portions counted as taken off; the subtotal is recomputed from what
 * is left, and a ticket left with nothing is cancelled.
 */
export async function voidLine(raw: LineChange): Promise<TicketChangeResult> {
  const input = lineChange.parse(raw)
  const line = await lineOwner(input.lineId)
  const actor = await requireRestaurantAccess({ id: line.restaurantId })
  return told(await changeTicket({ orderId: line.orderId, lineId: input.lineId, quantity: input.quantity, reason: input.reason, note: input.note || null }, actor, 'void'))
}

/**
 * A manager of the order's own restaurant, or a super admin: parses `changeLogQuery` and answers
 * the order's change log, newest first (who, what, when and why: lib/change-log.ts).
 */
export async function readChangeLog(raw: ChangeLogQuery): Promise<ChangeLogEntry[]> {
  const { orderId } = changeLogQuery.parse(raw)
  await requireRestaurantAccess({ id: await orderRestaurant(orderId) })
  return loadChangeLog(orderId)
}
