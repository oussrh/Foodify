// components/menu/tracking/use-active-order.ts
// The one order the menu's pill talks about: the newest the guest placed from this device that is
// not yet served or cancelled, followed live so the pill's words move with the kitchen, and
// dropped from the device's list once it is finished or the server no longer knows it.
'use client'

import type { OrderStatus } from '@/lib/orders'
import { useGuestOrders } from './use-guest-orders'
import { useOrderTracking } from './use-order-tracking'

/** What the pill shows and links to. */
export interface ActiveOrder {
  token: string
  number: number
  status: OrderStatus
}

/** The guest's order still to follow at `restaurantId`, with its latest status; null when there is none. */
export function useActiveOrder(restaurantId: string): ActiveOrder | null {
  const guest = useGuestOrders(restaurantId)
  const active = guest.active
  const tracking = useOrderTracking(
    active?.token ?? null,
    (order) => {
      if (active) guest.setStatus(active.token, order.status)
    },
    () => {
      if (active) guest.forget(active.token)
    },
  )
  if (!active) return null
  return { token: active.token, number: active.number, status: tracking.order?.status ?? active.status }
}
