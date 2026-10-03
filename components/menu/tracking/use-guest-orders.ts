// components/menu/tracking/use-guest-orders.ts
// The orders the guest placed from this device at one restaurant (lib/guest-orders.ts), as React
// state: one store per restaurant, read from localStorage on first use, written on every change,
// followed across tabs through the storage event, and pruned of what is over when a screen first
// subscribes. The server renders no orders; the device's appear once hydrated.
'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { activeOrder, forgetOrder, pruneOrders, rememberOrder, withStatus, type PlacedTracking, type SeenOrder } from '@/lib/guest-orders'
import { guestOrdersKey, parseGuestOrders, readGuestOrders, writeGuestOrders } from '@/lib/guest-orders-storage'
import type { GuestOrderEntry } from '@/lib/schemas/order-tracking'

type Store = { list: GuestOrderEntry[]; listeners: Set<() => void> }
const stores = new Map<string, Store>()
const NONE: GuestOrderEntry[] = []

function storeFor(restaurantId: string): Store {
  let store = stores.get(restaurantId)
  if (!store) {
    store = { list: readGuestOrders(restaurantId), listeners: new Set() }
    stores.set(restaurantId, store)
  }
  return store
}

function commit(restaurantId: string, list: GuestOrderEntry[]) {
  const store = storeFor(restaurantId)
  if (list === store.list) return
  store.list = list
  writeGuestOrders(restaurantId, list)
  store.listeners.forEach((listener) => listener())
}

export interface GuestOrders {
  /** The newest order still to follow, or null. */
  active: GuestOrderEntry | null
  /** Remembers an order the guest has just placed. */
  remember: (placed: PlacedTracking) => void
  /** Records what a poll read: the status, and whether the bill was closed. */
  setStatus: (token: string, seen: SeenOrder) => void
  /** Forgets an order the server no longer knows. */
  forget: (token: string) => void
}

/** The guest's remembered orders at `restaurantId`: kept on the device, followed across tabs, empty on the server. */
export function useGuestOrders(restaurantId: string): GuestOrders {
  const subscribe = useCallback(
    (listener: () => void) => {
      const store = storeFor(restaurantId)
      store.listeners.add(listener)
      // What finished hours ago, or belongs to an earlier visit, goes as soon as a screen looks.
      commit(restaurantId, pruneOrders(store.list, new Date()))
      const sync = (event: StorageEvent) => {
        if (event.key !== guestOrdersKey(restaurantId)) return
        store.list = parseGuestOrders(event.newValue)
        store.listeners.forEach((l) => l())
      }
      window.addEventListener('storage', sync)
      return () => {
        store.listeners.delete(listener)
        window.removeEventListener('storage', sync)
      }
    },
    [restaurantId],
  )
  const getSnapshot = useCallback(() => storeFor(restaurantId).list, [restaurantId])
  const list = useSyncExternalStore(subscribe, getSnapshot, () => NONE)

  return useMemo(
    () => ({
      active: activeOrder(list),
      remember: (placed: PlacedTracking) => commit(restaurantId, rememberOrder(storeFor(restaurantId).list, placed, new Date())),
      setStatus: (token: string, seen: SeenOrder) => commit(restaurantId, withStatus(storeFor(restaurantId).list, token, seen, new Date())),
      forget: (token: string) => commit(restaurantId, forgetOrder(storeFor(restaurantId).list, token)),
    }),
    [list, restaurantId],
  )
}
