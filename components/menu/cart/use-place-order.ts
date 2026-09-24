// components/menu/cart/use-place-order.ts
// Sending the order: the one request to POST /api/orders, what the sheet shows while it is in
// flight, and the message for each way it can fail. The cart is emptied only once the server
// has answered with an order number.
'use client'

import { useState } from 'react'
import { z } from 'zod'
import { ApiError, call } from '@/lib/api-client'
import { type Locale } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import { placedOrder, refusedDish, type PlacedOrder } from '@/lib/schemas/order'
import { checkOrder, type OrderDraft, type OrderField } from './order-check'

type State = { status: 'idle' | 'sending'; error: string; field: OrderField | null } | { status: 'sent'; order: PlacedOrder }

const IDLE: State = { status: 'idle', error: '', field: null }
// What a 409 carries: the dishes it would not take. A body of another shape names none.
const refusedDishes = z.array(refusedDish).catch([])

/** The dishes the server named, in the guest's language; empty when it named none it could name. */
function soldOutNames(details: unknown, locale: Locale): string[] {
  return refusedDishes
    .parse(details)
    .filter((dish) => dish.reason === 'sold_out')
    .map((dish) => (locale === 'fr' ? dish.nameFr : dish.nameEn))
    .filter((name): name is string => typeof name === 'string' && name.length > 0)
}

/**
 * The message for a failure the guest can act on; anything else is the generic one. A dish that
 * sold out between picking it and sending is named, because "the menu has changed" leaves someone
 * re-sending the same order and failing the same way.
 */
function messageFor(error: unknown, locale: Locale): string {
  const t = MENU_TEXT[locale]
  if (!(error instanceof ApiError)) return t.orderFailed
  if (error.code === 'forbidden') return t.orderingOff
  if (error.code === 'unavailable') {
    const names = soldOutNames(error.details, locale)
    if (names.length > 1) return t.soldOutSincePlural(names.join(', '))
    const [name] = names
    return name ? t.soldOutSince(name) : t.menuChanged
  }
  // `invalid_payload` is something in what was sent, not the menu moving under it: saying "the
  // menu has changed" sends somebody to look at their order for a problem that is not there.
  if (error.code === 'invalid_payload') return t.orderRejected
  if (error.code === 'not_found') return t.menuChanged
  return t.orderFailed
}

export interface PlaceOrder {
  status: 'idle' | 'sending' | 'sent'
  /** What went wrong with the last attempt, in the guest's language; '' when nothing did. */
  error: string
  /** The field the last attempt was refused over before it was sent; null when none was. */
  field: OrderField | null
  /** The order the server took, once it has. */
  order: PlacedOrder | null
  /**
   * Checks the order with the route's own schema, then sends it; `requirePhone` is the guest's case.
   * Resolves false when the check refused it and nothing was sent.
   */
  send: (draft: OrderDraft, requirePhone: boolean) => Promise<boolean>
  /** Back to the form, for a second order at the same table. */
  reset: () => void
}

/**
 * Checks the order with `orderInput` (the route's own schema) and sends it to POST /api/orders,
 * saying what went wrong in the guest's language; the cart is emptied only once an order number
 * comes back.
 */
export function usePlaceOrder(locale: Locale, onSent: () => void): PlaceOrder {
  const [state, setState] = useState<State>(IDLE)

  const send = async (draft: OrderDraft, requirePhone: boolean): Promise<boolean> => {
    const checked = checkOrder(draft, locale, requirePhone)
    if (!checked.ok) {
      setState({ status: 'idle', error: checked.message, field: checked.field })
      return false
    }
    setState({ status: 'sending', error: '', field: null })
    try {
      const { data } = await call<unknown>('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checked.body),
      })
      // The order is stored once the POST answers: a body off its expected shape must not read as a
      // failure, or the guest sends again and the kitchen gets it twice. The sent screen then has
      // the table the guest gave and no number, rather than an error over an order that stands.
      const placed = placedOrder.safeParse(data)
      setState({ status: 'sent', order: placed.success ? placed.data : { id: '', number: 0, table: checked.body.table ?? '', subtotal: '' } })
      onSent()
    } catch (error) {
      setState({ status: 'idle', error: messageFor(error, locale), field: null })
    }
    return true
  }

  return {
    status: state.status,
    error: state.status === 'sent' ? '' : state.error,
    field: state.status === 'sent' ? null : state.field,
    order: state.status === 'sent' ? state.order : null,
    send,
    reset: () => setState(IDLE),
  }
}
