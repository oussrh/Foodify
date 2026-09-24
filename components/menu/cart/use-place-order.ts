// components/menu/cart/use-place-order.ts
// Sending the order: the one request to POST /api/orders, what the sheet shows while it is in
// flight, and the message for each way it can fail. The cart is emptied only once the server
// has answered with an order number.
'use client'

import { useState } from 'react'
import { ApiError, call } from '@/lib/api-client'
import type { CartLine } from '@/lib/cart'
import { type Locale } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import type { PlacedOrder } from '@/lib/schemas/order'

type State = { status: 'idle' | 'sending'; error: string } | { status: 'sent'; order: PlacedOrder }

/** What `POST /api/orders` sends with a 409: the dishes it would not take, and why. */
interface RefusedDish {
  nameEn: string | null
  nameFr: string | null
  reason: 'sold_out' | 'off_menu'
}

/** The dishes the server named, in the guest's language; empty when it named none it could name. */
function soldOutNames(details: unknown, locale: Locale): string[] {
  if (!Array.isArray(details)) return []
  return (details as RefusedDish[])
    .filter((dish) => dish && dish.reason === 'sold_out')
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
  /** The order the server took, once it has. */
  order: PlacedOrder | null
  send: (input: { restaurantId: string; table: string; phone: string; lines: CartLine[]; note: string }) => Promise<void>
  /** Back to the form, for a second order at the same table. */
  reset: () => void
}

/**
 * Sends the order to POST /api/orders and says what went wrong in the guest's language; the cart is
 * emptied only once an order number comes back.
 */
export function usePlaceOrder(locale: Locale, onSent: () => void): PlaceOrder {
  const [state, setState] = useState<State>({ status: 'idle', error: '' })

  const send = async ({ restaurantId, table, phone, lines, note }: { restaurantId: string; table: string; phone: string; lines: CartLine[]; note: string }) => {
    setState({ status: 'sending', error: '' })
    try {
      const { data } = await call<PlacedOrder>('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // An empty phone is left out rather than sent as '': a waiter has nobody to text, and the
        // shape reads a missing key as "no phone" (the schema also folds '' to the same thing).
        body: JSON.stringify({
          restaurantId,
          table: table.trim(),
          phone: phone.trim() || undefined,
          locale,
          note: note.trim() || undefined,
          lines,
        }),
      })
      setState({ status: 'sent', order: data })
      onSent()
    } catch (error) {
      setState({ status: 'idle', error: messageFor(error, locale) })
    }
  }

  return {
    status: state.status,
    error: state.status === 'sent' ? '' : state.error,
    order: state.status === 'sent' ? state.order : null,
    send,
    reset: () => setState({ status: 'idle', error: '' }),
  }
}
