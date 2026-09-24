// server/ticket-changes.ts
// Taking something off a ticket after it went to the kitchen, and the kitchen's answer when that
// had to be asked. Each runs in one transaction that locks the ticket and its bill first and
// decides on what it reads under the lock (lib/bill-rules.ts), so a waiter's removal, the pass
// moving the same ticket and a close on another phone cannot act on a state that is no longer
// true. Every change writes an OrderChange row; a request is one left PENDING until the kitchen
// decides. A closed bill is final: only a manager's void still changes it (a refund).
import type { OrderChangeKind } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { removeFrom } from '@/lib/bill-lines'
import { billActor, pendingRefusal, staffChange, voidRefusal, type ChangeMode, type ChangeReason, type TicketRefusal } from '@/lib/bill-rules'
import type { OrderStatus } from '@/lib/orders'
import { lockWithBill } from '@/server/order-lock'
import { applyRemoval, billClosed, refusePending, TICKET_SELECT, type TicketRow } from '@/server/ticket-apply'

/** Who is acting: the signed-in user as the guard answered it. */
export type Actor = { id: string; role: string }

/** One change asked for on a ticket: the whole of it (`lineId` null) or `quantity` of one line, and why. */
export type TicketChangeInput = { orderId: string; lineId: string | null; quantity: number | null; reason: ChangeReason; note: string | null }

/**
 * What a change came to: applied at once, or asked of the kitchen; or why it was refused.
 * `answered` are the requests this change answered (refused: a ticket cancelled by it has
 * nothing left for them to change), whose waiters are told.
 */
export type TicketChangeResult =
  | { ok: true; outcome: 'applied' | 'requested'; changeId: string; status: OrderStatus; subtotal: string; answered: string[] }
  | { ok: false; refused: TicketRefusal }

/** How the change goes through for this actor on this ticket, or why it cannot: after a close, only a void. */
function modeFor(actor: Actor, ticket: TicketRow, via: 'staff' | 'void'): ChangeMode | TicketRefusal {
  if (via === 'void') return voidRefusal(billActor(actor.role), ticket.status) ?? 'direct'
  if (billClosed(ticket)) return 'bill_closed'
  return staffChange(billActor(actor.role), ticket.status)
}

/** Why the line asked for cannot lose `quantity` more, or null when it can (a whole ticket always can). */
function lineRefusal(ticket: TicketRow, input: TicketChangeInput): TicketRefusal | null {
  if (input.lineId === null) return null
  const line = ticket.lines.find((candidate) => candidate.id === input.lineId)
  if (!line) return 'nothing_left'
  const after = removeFrom(line, input.quantity ?? 1)
  return typeof after === 'string' ? after : null
}

/** The kind of row a change writes. */
function kindOf(input: TicketChangeInput, via: 'staff' | 'void'): OrderChangeKind {
  if (via === 'void') return 'VOID'
  return input.lineId === null ? 'CANCEL' : 'REMOVE'
}

/**
 * Cancels a ticket or takes a dish off it (`via` 'staff': a waiter or a manager), or voids it
 * (`via` 'void': a manager, once it is ready or served). The caller has guarded the ticket's
 * restaurant; the rules on the status, the bill and the actor are decided here under the lock. A
 * change the kitchen must answer is written as a pending request and nothing else moves until it does.
 */
export async function changeTicket(input: TicketChangeInput, actor: Actor, via: 'staff' | 'void'): Promise<TicketChangeResult> {
  return prisma.$transaction(async (tx) => {
    await lockWithBill(tx, input.orderId)
    const ticket = await tx.order.findUniqueOrThrow({ where: { id: input.orderId }, select: TICKET_SELECT })
    const mode = modeFor(actor, ticket, via)
    if (mode !== 'direct' && mode !== 'request') return { ok: false, refused: mode }
    const refused = lineRefusal(ticket, input) ?? (mode === 'request' ? pendingRefusal(ticket.changes, { kind: input.lineId === null ? 'CANCEL' : 'REMOVE', lineId: input.lineId }) : null)
    if (refused) return { ok: false, refused }

    const record = {
      restaurantId: ticket.restaurantId,
      orderId: ticket.id,
      lineId: input.lineId,
      kind: kindOf(input, via),
      quantity: input.lineId === null ? null : input.quantity,
      reason: input.reason,
      note: input.note,
      requestedById: actor.id,
    }
    if (mode === 'request') {
      const change = await tx.orderChange.create({ data: { ...record, status: 'PENDING' }, select: { id: true } })
      return { ok: true, outcome: 'requested', changeId: change.id, status: ticket.status, subtotal: ticket.subtotal.toFixed(2), answered: [] }
    }
    const state = await applyRemoval(tx, ticket, { lineId: input.lineId, quantity: input.quantity, voided: via === 'void' })
    const change = await tx.orderChange.create({ data: { ...record, status: 'APPLIED' }, select: { id: true } })
    const answered = state.status === 'CANCELLED' ? await refusePending(tx, [ticket.id], actor.id) : []
    return { ok: true, outcome: 'applied', changeId: change.id, ...state, answered }
  })
}

/** Why a request could not be accepted: answered already, or gone stale under the kitchen. */
export type StaleRequest = 'cancelled' | 'not_cooking' | 'bill_closed' | 'nothing_left'

/**
 * What an answer came to: the request as it now stands; or why there was nothing to answer.
 * `answered` are the requests this answered (the one decided, a stale one refused, and any a
 * cancel made moot), whose waiters are told.
 */
export type DecisionResult =
  | { ok: true; status: 'APPLIED' | 'REFUSED'; orderStatus: OrderStatus; answered: string[] }
  | { ok: false; refused: 'decided' }
  | { ok: false; refused: StaleRequest; answered: string[] }

/**
 * What is left of the line a request names (null for a whole ticket), and whether the request
 * has gone stale under it: a request is about food being made, so a ticket cancelled, made or
 * served since, a bill closed since, or a line already taken off whole, leaves it nothing to do.
 */
function standing(ticket: TicketRow, lineId: string | null): { left: number | null; stale: StaleRequest | null } {
  const line = ticket.lines.find((candidate) => candidate.id === lineId)
  const left = line ? line.quantity - line.removedQuantity : null
  if (ticket.status === 'CANCELLED') return { left, stale: 'cancelled' }
  if (ticket.status !== 'ACCEPTED') return { left, stale: 'not_cooking' }
  if (billClosed(ticket)) return { left, stale: 'bill_closed' }
  return { left, stale: left !== null && left <= 0 ? 'nothing_left' : null }
}

/**
 * The kitchen's answer to a pending request. Accepting applies it as if it had been direct (a
 * removal takes what is still left, if less than was asked); refusing leaves the ticket as it is.
 * A request already answered changes nothing more; one gone stale is refused and says why.
 */
export async function decideChange(changeId: string, accept: boolean, decider: Actor): Promise<DecisionResult> {
  return prisma.$transaction(async (tx) => {
    const asked = await tx.orderChange.findUniqueOrThrow({ where: { id: changeId }, select: { orderId: true } })
    await lockWithBill(tx, asked.orderId)
    const change = await tx.orderChange.findUniqueOrThrow({ where: { id: changeId }, select: { status: true, lineId: true, quantity: true } })
    if (change.status !== 'PENDING') return { ok: false, refused: 'decided' }
    const ticket = await tx.order.findUniqueOrThrow({ where: { id: asked.orderId }, select: TICKET_SELECT })
    const decided = { decidedById: decider.id, decidedAt: new Date() }
    const { left, stale } = standing(ticket, change.lineId)
    if (!accept || stale) {
      await tx.orderChange.update({ where: { id: changeId }, data: { status: 'REFUSED', ...decided }, select: { id: true } })
      return stale ? { ok: false, refused: stale, answered: [changeId] } : { ok: true, status: 'REFUSED', orderStatus: ticket.status, answered: [changeId] }
    }
    const quantity = left === null ? null : Math.min(left, change.quantity ?? 1)
    const state = await applyRemoval(tx, ticket, { lineId: change.lineId, quantity, voided: false })
    await tx.orderChange.update({ where: { id: changeId }, data: { status: 'APPLIED', quantity, ...decided }, select: { id: true } })
    const moot = state.status === 'CANCELLED' ? await refusePending(tx, [ticket.id], decider.id) : []
    return { ok: true, status: 'APPLIED', orderStatus: state.status, answered: [changeId, ...moot] }
  })
}
