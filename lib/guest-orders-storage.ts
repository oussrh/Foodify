// lib/guest-orders-storage.ts
// Where the guest's remembered orders (lib/guest-orders.ts) live: localStorage, one key per
// restaurant, parsed on the way in so a value from another version or a hand edit reads as no
// orders rather than a crash. Every access is wrapped: private mode, a full quota or storage
// switched off leaves the menu without a pill, never without a menu.
import { storedGuestOrders, type GuestOrderEntry } from '@/lib/schemas/order-tracking'

/** The localStorage key of a restaurant's remembered orders. */
export const guestOrdersKey = (restaurantId: string) => `foodify-orders:${restaurantId}`

/** A stored value as the list, or none for anything that is not one. */
export function parseGuestOrders(raw: string | null): GuestOrderEntry[] {
  if (!raw) return []
  try {
    return storedGuestOrders.parse(JSON.parse(raw))
  } catch {
    return []
  }
}

/** The restaurant's remembered orders; none when storage is unavailable or holds nothing usable. */
export function readGuestOrders(restaurantId: string): GuestOrderEntry[] {
  try {
    return parseGuestOrders(window.localStorage.getItem(guestOrdersKey(restaurantId)))
  } catch {
    return []
  }
}

/** Stores the list, or removes the key for an empty one; a storage failure is ignored. */
export function writeGuestOrders(restaurantId: string, list: readonly GuestOrderEntry[]): void {
  try {
    const key = guestOrdersKey(restaurantId)
    if (list.length === 0) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(list))
  } catch {
    // storage unavailable
  }
}
