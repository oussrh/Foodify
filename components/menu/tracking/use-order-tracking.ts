// components/menu/tracking/use-order-tracking.ts
// The guest's phone asking how their order is doing: GET /api/orders/track/<secret> every few
// seconds while the page is in view, and not at all while it is hidden (a phone in a pocket
// spends nothing), at once when it comes back. One request at a time, each numbered, and what an
// answer does is lib/tracking-poll.ts: a stale answer is dropped, a failure keeps the last status
// on screen and says the phone is offline (the board's rule, use-order-board.ts), and the poll
// stops for good once the order is served, cancelled or its bill closed, the server says the
// secret is unknown, or it answers something this page cannot read.
'use client'

import { useEffect, useEffectEvent, useState } from 'react'
import { call } from '@/lib/api-client'
import { trackedOrder, type TrackedOrder } from '@/lib/schemas/order-tracking'
import { POLL_START, applyAnswer, failureOf, shouldPoll, type PollAnswer, type PollState } from '@/lib/tracking-poll'

/** How often a guest's phone asks: often enough to see "on its way" before the plate lands. */
const TRACK_POLL_MS = 10_000

export interface OrderTracking {
  /** The last answer, kept through a failed poll; null until the first. */
  order: TrackedOrder | null
  /** False once a poll has failed, true again on the next one that answers. */
  online: boolean
  /** The server does not know this secret (never did, or not any more). */
  gone: boolean
  /** The server answered in a shape this page cannot read: a reload fetches the page that can. */
  outdated: boolean
}

/** A short buzz when the food is called up, where the phone can (never on iPhone; nothing when it cannot). */
function buzz() {
  try {
    navigator.vibrate?.(200)
  } catch {
    // not allowed here
  }
}

/** The request's answer as the poll reads it. */
async function ask(token: string, seq: number): Promise<PollAnswer> {
  try {
    const { data } = await call<unknown>(`/api/orders/track/${token}`)
    const parsed = trackedOrder.safeParse(data)
    return parsed.success ? { seq, kind: 'order', order: parsed.data } : { seq, kind: 'unreadable' }
  } catch (error) {
    return { seq, kind: failureOf(error) }
  }
}

/**
 * Follows the order named by `token` (nothing when null). `onOrder` hears every answer and
 * `onGone` the server saying the secret is unknown, for the device's list of orders to keep up;
 * the phone buzzes once when this page sees the order go from the kitchen to ready.
 */
export function useOrderTracking(token: string | null, onOrder: (order: TrackedOrder) => void, onGone: () => void): OrderTracking {
  const [view, setView] = useState<{ token: string | null; state: PollState }>({ token, state: POLL_START })
  const heard = useEffectEvent(onOrder)
  const lost = useEffectEvent(onGone)

  useEffect(() => {
    if (!token) return
    let live = true
    let inFlight = false
    let sent = 0
    let state = POLL_START
    const poll = async () => {
      if (!live || !shouldPoll(state, document.visibilityState === 'visible', inFlight)) return
      inFlight = true
      const answer = await ask(token, ++sent)
      inFlight = false
      if (!live) return
      const effects = applyAnswer(state, answer)
      if (effects.state === state) return
      state = effects.state
      setView({ token, state })
      if (effects.buzz) buzz()
      if (effects.heard) heard(effects.heard)
      if (effects.forget) lost()
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
  const state = view.token === token ? view.state : POLL_START
  return { order: state.order, online: state.online, gone: state.gone, outdated: state.outdated }
}
