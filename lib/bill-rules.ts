// lib/bill-rules.ts
// Who may take what off a sent order, and how. A ticket the kitchen has not started is the
// floor's to change; one being cooked is the kitchen's, so the floor asks and the kitchen answers;
// one already plated or served is money, so only a manager takes it off, and it stays on record
// as voided. Every change carries a reason from a short list. Decided here, once, so the action
// that refuses and the button that is not offered never disagree. Client-safe.
import type { OrderStatus } from '@/lib/orders'

/** Why a dish or a ticket was taken off; `other` is the only one that needs a note. */
export const CHANGE_REASONS = ['changed_mind', 'mistake', 'too_slow', 'unavailable', 'other'] as const
/** One of CHANGE_REASONS; the same set as Prisma's OrderChangeReason enum. */
export type ChangeReason = (typeof CHANGE_REASONS)[number]

/** What each reason is called where a waiter picks one: a sentence the guest's answer maps onto. */
export const REASON_LABEL: Record<ChangeReason, string> = {
  changed_mind: 'Guest changed their mind',
  mistake: 'Ordered by mistake',
  too_slow: 'Took too long',
  unavailable: 'Kitchen can’t make it',
  other: 'Other',
}

/** The longest note a change takes: a reason, not a story. */
export const MAX_CHANGE_NOTE = 200

/** Whether a reason with this note is complete: `other` says nothing without one. */
export function reasonComplete(reason: ChangeReason, note: string | null | undefined): boolean {
  return reason !== 'other' || (note ?? '').trim().length > 0
}

/** Who is acting on a bill, by what they are rather than by their role's name. */
export type BillActor = 'waiter' | 'manager' | 'kitchen'

/** The actor a role acts as: a super admin and a restaurant's manager are managers; a tablet is the kitchen. */
export function billActor(role: string): BillActor {
  if (role === 'SUPER_ADMIN' || role === 'RESTAURANT_ADMIN') return 'manager'
  if (role === 'WAITER') return 'waiter'
  return 'kitchen'
}

/** How a change the floor asks for goes through: at once, or as a request the kitchen answers. */
export type ChangeMode = 'direct' | 'request'

/** Why a change to a ticket was refused. */
export type TicketRefusal = 'cancelled' | 'manager_only' | 'not_staff' | 'not_manager' | 'not_served' | 'bill_closed' | 'pending' | 'too_many' | 'nothing_left'

/** What the person is told for each refusal, and what to do instead. */
export const TICKET_REFUSED: Record<TicketRefusal, string> = {
  cancelled: 'That order is already cancelled',
  manager_only: 'It has left the kitchen: only a manager can void it',
  not_staff: 'Only the floor or a manager can change an order',
  not_manager: 'Only a manager can void a dish',
  not_served: 'It has not left the kitchen yet: cancel or remove it instead',
  bill_closed: 'That bill is closed: only a manager can void from it now',
  pending: 'The kitchen has not answered the last request yet',
  too_many: 'That is more than is left on the order',
  nothing_left: 'Nothing is left on that order to take off',
}

/**
 * How a waiter's or a manager's cancel or removal on a ticket at `status` goes through, or why it
 * cannot: a ticket still waiting is changed at once; one being cooked becomes a request the
 * kitchen accepts or refuses; one plated or served is a manager's void, never the floor's. The
 * kitchen does not ask itself: it has its own cancel on the board.
 */
export function staffChange(actor: BillActor, status: OrderStatus): ChangeMode | TicketRefusal {
  if (actor === 'kitchen') return 'not_staff'
  if (status === 'CANCELLED') return 'cancelled'
  if (status === 'NEW') return 'direct'
  if (status === 'ACCEPTED') return 'request'
  return 'manager_only'
}

/**
 * Whether `actor` may void on a ticket at `status`: a manager, once the ticket is ready or served
 * and only then. Before that a manager cancels or removes like the floor (at once while it waits,
 * by asking the kitchen while it cooks). A void is applied at once and recorded as one; it is how
 * a plate that went out comes off the bill, closed or not (a refund).
 */
export function voidRefusal(actor: BillActor, status: OrderStatus): TicketRefusal | null {
  if (actor !== 'manager') return 'not_manager'
  if (status === 'CANCELLED') return 'cancelled'
  return status === 'READY' || status === 'DONE' ? null : 'not_served'
}

/** Whether a manager may void on a ticket at `status`: what the Void buttons are drawn for. */
export function voidable(status: OrderStatus): boolean {
  return voidRefusal('manager', status) === null
}

/** What a request for the kitchen names: a whole ticket, or `quantity` of one dish on it. */
export type RequestKind = 'CANCEL' | 'REMOVE'

/**
 * Whether a new request may be made while `pending` are open on the same ticket: never a second
 * one for the same line, and nothing more once the whole ticket is asked to be cancelled.
 */
export function pendingRefusal(pending: readonly { kind: string; lineId: string | null }[], asked: { kind: RequestKind; lineId: string | null }): 'pending' | null {
  if (pending.some((request) => request.kind === 'CANCEL')) return 'pending'
  if (asked.kind === 'REMOVE' && pending.some((request) => request.lineId === asked.lineId)) return 'pending'
  return null
}

/** What the waiter's button says for a mode: take it off now, or ask the kitchen to. */
export function changeLabel(mode: ChangeMode, what: 'cancel' | 'remove'): string {
  if (what === 'cancel') return mode === 'direct' ? 'Cancel order' : 'Ask the kitchen to cancel'
  return mode === 'direct' ? 'Remove' : 'Ask to remove'
}
