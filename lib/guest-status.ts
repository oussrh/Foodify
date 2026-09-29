// lib/guest-status.ts
// An order's status as the guest who placed it reads it. The kitchen's five statuses become four
// steps a guest can picture (sent, being prepared, on its way, served) or a cancellation, each
// with the moment it was reached when the row has one. The words are MENU_TEXT's
// (`orderStatus`); this is only the mapping, so both languages read the same facts. Client-safe.
import { CLOSED_STATUSES, type OrderStatus } from '@/lib/orders'

/** The steps of an order the guest sees, in the order they happen. */
export const GUEST_STEPS = ['sent', 'preparing', 'ready', 'served'] as const
/** One of `GUEST_STEPS`. */
export type GuestStep = (typeof GUEST_STEPS)[number]
/** What the guest is told an order is at: a step, or cancelled. */
export type GuestStatus = GuestStep | 'cancelled'

const STEP_OF: Record<OrderStatus, GuestStatus> = {
  NEW: 'sent',
  ACCEPTED: 'preparing',
  READY: 'ready',
  DONE: 'served',
  CANCELLED: 'cancelled',
}

/** The guest's reading of a kitchen status. */
export function guestStatus(status: OrderStatus): GuestStatus {
  return STEP_OF[status]
}

/** Whether there is nothing more to follow: served or cancelled. */
export function isFinished(status: OrderStatus): boolean {
  return (CLOSED_STATUSES as readonly OrderStatus[]).includes(status)
}

/** The moments an order's row stamps, as ISO strings (null when not reached, or skipped). */
export interface OrderStamps {
  status: OrderStatus
  createdAt: string
  acceptedAt: string | null
  readyAt: string | null
  servedAt: string | null
}

/** One step as the progress list draws it: reached or not, the one the order is at, and when. */
export interface StepView {
  step: GuestStep
  reached: boolean
  current: boolean
  at: string | null
}

/**
 * The four steps of an order that is not cancelled, each reached when the order is at it or past
 * it. A step the kitchen skipped (called up without accepting first) counts as reached and has no
 * time, rather than a time it never had. Null for a cancelled order, which has no progress to show.
 */
export function stepViews(order: OrderStamps): StepView[] | null {
  const at = guestStatus(order.status)
  if (at === 'cancelled') return null
  const index = GUEST_STEPS.indexOf(at)
  const stamps: Record<GuestStep, string | null> = { sent: order.createdAt, preparing: order.acceptedAt, ready: order.readyAt, served: order.servedAt }
  return GUEST_STEPS.map((step, i) => ({ step, reached: i <= index, current: i === index, at: i <= index ? stamps[step] : null }))
}
