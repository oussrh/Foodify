// app/actions/ticket-actions.ts
// Taking something off a ticket after it went to the kitchen: the floor cancels a ticket or
// removes a dish (at once while the kitchen has not started it, as a request once it is cooking),
// and the kitchen answers a request. The rules are lib/bill-rules.ts, the writes
// server/ticket-changes.ts; here, the parse, the row's own restaurant and the guard.
'use server'

import { requireBoardAction, requireOrderingStaff } from '@/lib/auth-guard'
import { lineChange, requestDecision, ticketChange, type LineChange, type RequestDecision, type TicketChange } from '@/lib/schemas/order-changes'
import { afterResponse } from '@/server/after-response'
import { changeRestaurant, lineOwner, orderRestaurant } from '@/server/order-owner'
import { pushChangeAnswers, pushChangeRequest } from '@/server/change-push'
import { changeTicket, decideChange, type DecisionResult, type TicketChangeResult } from '@/server/ticket-changes'

/** A request is news for the pass, an answer news for the floor: each pushed once the caller has its answer. */
function announce(result: TicketChangeResult): TicketChangeResult {
  if (result.ok && result.outcome === 'requested') afterResponse(() => pushChangeRequest(result.changeId))
  // A ticket this change cancelled answered the requests still open on it: their waiters are told.
  if (result.ok && result.answered.length > 0) afterResponse(() => pushChangeAnswers(result.answered))
  return result
}

/**
 * A waiter, a manager or a super admin of the ticket's own restaurant (a kitchen tablet is
 * refused: it has its own cancel on the board). Parses `ticketChange` and cancels the whole
 * ticket: at once while it is waiting, as a request to the kitchen once it is being made, never by
 * the floor once it has left the kitchen. Answers `TicketChangeResult`: `{ ok, outcome, status,
 * subtotal }`, or `{ ok: false, refused }` with the reason (lib/bill-rules.ts TICKET_REFUSED).
 */
export async function cancelTicket(raw: TicketChange): Promise<TicketChangeResult> {
  const input = ticketChange.parse(raw)
  const actor = await requireOrderingStaff(await orderRestaurant(input.orderId))
  return announce(await changeTicket({ orderId: input.orderId, lineId: null, quantity: null, reason: input.reason, note: input.note || null }, actor, 'staff'))
}

/**
 * The same people as `cancelTicket`, on one line: parses `lineChange` and takes `quantity` portions
 * of the dish off its ticket, under the same rule by status. The line stays, with what was taken
 * off counted beside it, and the subtotal is recomputed; a ticket left with nothing is cancelled.
 */
export async function removeLine(raw: LineChange): Promise<TicketChangeResult> {
  const input = lineChange.parse(raw)
  const line = await lineOwner(input.lineId)
  const actor = await requireOrderingStaff(line.restaurantId)
  const change = { orderId: line.orderId, lineId: input.lineId, quantity: input.quantity, reason: input.reason, note: input.note || null }
  return announce(await changeTicket(change, actor, 'staff'))
}

/**
 * The restaurant's kitchen tablet or a manager (a waiter is refused: the floor asks, the pass
 * answers). Parses `requestDecision`: accepting applies the request as if it had been made at
 * once, refusing leaves the ticket as it is. A request on a ticket no longer being made (made,
 * served, cancelled) or whose bill has closed is refused as stale. The waiter who asked is pushed
 * the answer either way. Answers `DecisionResult`; an answer already given is `{ ok: false, refused: 'decided' }`.
 */
export async function decideRequest(raw: RequestDecision): Promise<DecisionResult> {
  const { changeId, accept } = requestDecision.parse(raw)
  const actor = await requireBoardAction(await changeRestaurant(changeId))
  const result = await decideChange(changeId, accept, actor)
  // Every answer reaches the waiter who asked, a stale request refused as much as a decided one.
  if ('answered' in result && result.answered.length > 0) afterResponse(() => pushChangeAnswers(result.answered))
  return result
}
