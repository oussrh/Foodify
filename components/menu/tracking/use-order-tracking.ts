// components/menu/tracking/use-order-tracking.ts
// The guest's phone asking how their order is doing: GET /api/orders/track/<secret> every few
// seconds while the page is in view, and not at all while it is hidden (a phone in a pocket
// spends nothing), at once when it comes back. It stops for good once the order is served or
// cancelled, or the server no longer knows it. A poll that fails keeps the last answer on screen
// and says the phone is offline; it never blanks (the board's rule, use-order-board.ts).
'use client'

import { useEffect, useEffectEvent, useState } from 'react'
import { ApiError, call } from '@/lib/api-client'
import { isFinished } from '@/lib/guest-status'
import { trackedOrder, type TrackedOrder } from '@/lib/schemas/order-tracking'

/** How often a guest's phone asks: often enough to see "on its way" before the plate lands. */
const TRACK_POLL_MS = 10_000

export interface OrderTracking {
  /** The last answer, kept through a failed poll; null until the first. */
  order: TrackedOrder | null
  /** False once a poll has failed, true again on the next one that answers. */
  online: boolean
  /** The server does not know this secret (never did, or not any more). */
  gone: boolean
}

type State = OrderTracking & { token: string | null }
const START: Omit<State, 'token'> = { order: null, online: true, gone: false }

/** A short buzz when the food is called up, where the phone can (never on iPhone; nothing when it cannot). */
function buzz() {
  try {
    navigator.vibrate?.(200)
  } catch {
    // not allowed here
  }
}

/**
 * Follows the order named by `token` (nothing when null). `onOrder` hears every answer and
 * `onGone` a 404, for the device's list of orders to keep up; the phone buzzes once when a poll
 * sees the order go from the kitchen to ready.
 */
export function useOrderTracking(token: string | null, onOrder: (order: TrackedOrder) => void, onGone: () => void): OrderTracking {
  const [state, setState] = useState<State>({ token, ...START })
  const heard = useEffectEvent(onOrder)
  const lost = useEffectEvent(onGone)

  useEffect(() => {
    if (!token) return
    let live = true
    let done = false
    let last: TrackedOrder['status'] | null = null
    const poll = async () => {
      if (!live || done || document.visibilityState !== 'visible') return
      try {
        const { data } = await call<unknown>(`/api/orders/track/${token}`)
        const order = trackedOrder.parse(data)
        if (!live) return
        if (order.status === 'READY' && last !== null && last !== 'READY') buzz()
        last = order.status
        done = isFinished(order.status)
        setState({ token, order, online: true, gone: false })
        heard(order)
      } catch (error) {
        if (!live) return
        const unknown = error instanceof ApiError && error.status === 404
        done = unknown
        setState((prev) => ({ ...(prev.token === token ? prev : { token, ...START }), online: unknown, gone: unknown }))
        if (unknown) lost()
      }
    }
    void poll()
    const timer = setInterval(() => void poll(), TRACK_POLL_MS)
    const onVisible = () => void poll()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      live = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [token])

  // A new token is a different order: what was on screen for the last one is not shown for it.
  return state.token === token ? { order: state.order, online: state.online, gone: state.gone } : START
}
