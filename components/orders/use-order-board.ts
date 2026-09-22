// components/orders/use-order-board.ts
// The board's own clock: it asks the server for this restaurant's open orders every few seconds
// and reports what came back. Polling rather than a stream on purpose — a tablet that sleeps,
// loses wifi or sits behind a proxy just misses a tick and catches up on the next one. A poll
// that fails leaves the last orders on screen and says the board is offline; it never blanks.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { call } from '@/lib/api-client'
import { type BoardOrder, type BoardView, viewStatuses } from '@/lib/orders'

/** How often the board asks. Short enough that a waiter sees an order while the guest is still putting the phone down. */
export const POLL_MS = 5000

export interface OrderBoard {
  orders: BoardOrder[]
  /** False once a poll has failed, true again on the next one that answers. */
  online: boolean
  /** True until the first answer, so the board can say "loading" rather than "no orders". */
  loading: boolean
  /** The ids that arrived on the last poll, for the row that should flash. */
  arrived: string[]
  /** Poll now, without waiting for the timer (after an action, or on a manual refresh). */
  refresh: () => void
}

/** `onNewOrder` must be stable (a `useCallback` with no dependencies, as `useChime` returns): the poll's timer is torn down and restarted when it changes. */
export function useOrderBoard(restaurantId: string, view: BoardView, onNewOrder: () => void): OrderBoard {
  const [orders, setOrders] = useState<BoardOrder[]>([])
  const [online, setOnline] = useState(true)
  const [loading, setLoading] = useState(true)
  const [arrived, setArrived] = useState<string[]>([])
  // What the last poll held, to tell a new order from one that is simply still there.
  const known = useRef<Set<string> | null>(null)

  const poll = useCallback(async () => {
    const query = new URLSearchParams({ restaurantId })
    for (const status of viewStatuses(view)) query.append('status', status)
    try {
      const { data } = await call<BoardOrder[]>(`/api/orders/board?${query.toString()}`)
      const seen = known.current
      const fresh = seen ? data.filter((order) => !seen.has(order.id)).map((order) => order.id) : []
      known.current = new Set(data.map((order) => order.id))
      setOrders(data)
      setArrived(fresh)
      setOnline(true)
      setLoading(false)
      // The first answer is the board filling up, not orders arriving; and an order being served
      // is not an arrival either, so only the working board announces itself.
      if (fresh.length > 0 && view === 'open') onNewOrder()
    } catch {
      setOnline(false)
      setLoading(false)
    }
  }, [restaurantId, view, onNewOrder])

  // A switch of view is a different list: forget what was on screen so nothing reads as "arrived".
  useEffect(() => {
    known.current = null
  }, [view])

  useEffect(() => {
    let live = true
    const tick = () => {
      if (live) void poll()
    }
    tick()
    const timer = setInterval(tick, POLL_MS)
    // A tablet that was asleep polls the moment it is looked at again.
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      live = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [poll])

  return { orders, online, loading, arrived, refresh: () => void poll() }
}
