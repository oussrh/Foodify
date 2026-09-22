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

/** The message for a failure the guest can act on; anything else is the generic one. */
function messageFor(error: unknown, locale: Locale): string {
  const t = MENU_TEXT[locale]
  if (!(error instanceof ApiError)) return t.orderFailed
  if (error.code === 'forbidden') return t.orderingOff
  if (error.code === 'invalid_payload' || error.code === 'not_found') return t.menuChanged
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

export function usePlaceOrder(locale: Locale, onSent: () => void): PlaceOrder {
  const [state, setState] = useState<State>({ status: 'idle', error: '' })

  const send = async ({ restaurantId, table, phone, lines, note }: { restaurantId: string; table: string; phone: string; lines: CartLine[]; note: string }) => {
    setState({ status: 'sending', error: '' })
    try {
      const { data } = await call<PlacedOrder>('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, table: table.trim(), phone: phone.trim(), locale, note: note.trim() || undefined, lines }),
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
