// components/menu/cart/order-check.ts
// The order checked in the browser with the schema POST /api/orders parses (`orderInput`), so a
// guest or a waiter reads what is wrong with a field before anything is sent. The schema's own
// messages are English; the menu speaks the guest's language, so a failing field is mapped to its
// MENU_TEXT message instead.
import type { CartLine } from '@/lib/cart'
import type { Locale } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import { orderInput, type OrderInput } from '@/lib/schemas/order'

/** The field an order was refused over: what the form marks invalid. `lines` has no field of its own. */
export type OrderField = 'table' | 'phone' | 'note' | 'lines'

/** What the sheet has when the guest (or the waiter) taps send. */
export interface OrderDraft {
  restaurantId: string
  table: string
  phone: string
  lines: CartLine[]
  note: string
  /** The table's open bill this order adds to: a waiter's only, never the guest's cart. */
  addTo?: string
}

/** The body to send, or the field that is wrong and what to say about it in the guest's language. */
export type OrderCheck = { ok: true; body: OrderInput } | { ok: false; field: OrderField; message: string }

// The message for the first thing wrong, by where the schema found it.
function refusal(path: readonly PropertyKey[], draft: OrderDraft, locale: Locale): { field: OrderField; message: string } {
  const t = MENU_TEXT[locale]
  const [key, , inLine] = path
  if (key === 'table') return { field: 'table', message: draft.table.trim() ? t.tableTooLong : t.tableRequired }
  if (key === 'phone') return { field: 'phone', message: t.phoneInvalid }
  if (key === 'note') return { field: 'note', message: t.noteTooLong }
  return { field: 'lines', message: key === 'lines' && inLine === 'note' ? t.lineNoteTooLong : t.orderRejected }
}

/**
 * Checks an order with `orderInput`, the schema the route parses. `requirePhone` is the guest's
 * case: the schema lets a phone be absent because a waiter has nobody to text, but a guest always
 * gives one.
 */
export function checkOrder(draft: OrderDraft, locale: Locale, requirePhone: boolean): OrderCheck {
  const t = MENU_TEXT[locale]
  const phone = draft.phone.trim()
  const parsed = orderInput.safeParse({
    restaurantId: draft.restaurantId,
    table: draft.table,
    phone: phone || undefined,
    locale,
    note: draft.note.trim() || undefined,
    lines: draft.lines,
    addTo: draft.addTo,
  })
  if (!parsed.success) return { ok: false, ...refusal(parsed.error.issues[0]?.path ?? [], draft, locale) }
  if (requirePhone && !phone) return { ok: false, field: 'phone', message: t.phoneRequired }
  return { ok: true, body: parsed.data }
}
