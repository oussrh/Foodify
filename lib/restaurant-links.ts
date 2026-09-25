// lib/restaurant-links.ts
// The addresses one restaurant runs on. Each is going to a different device — a guest's phone, a
// tablet on the pass, a waiter's phone — so all three are absolute, built from the public origin
// rather than from whatever host the portal happens to be open on.
import { deviceLinks } from '@/lib/restaurant-paths'

/** What a restaurant's three addresses are, given the public origin. */
export interface RestaurantLinks {
  /** What a diner scans: the public menu, by slug, so it survives a change of id. */
  menu: string
  /** Where an order tablet lands once it signs in: the board, outside any portal. */
  tablet: string
  /** Where a waiter lands once they sign in: the room's tables and the live menu. */
  waiter: string
}

/**
 * The three addresses, absolute. The device ones are by the restaurant's short code, not its slug
 * and not its uuid: a slug follows the restaurant's name and would break the tab left open on the
 * pass when somebody renames it, and a uuid is thirty-six characters to read off a screen and
 * type into a tablet. A code is six, and is assigned once (`lib/restaurant-code.ts`).
 *
 * The routes still accept a uuid, so an address saved to a tablet's home screen before codes
 * existed keeps working.
 */
export function restaurantLinks(origin: string, restaurant: { code: string; slug: string }): RestaurantLinks {
  const devices = deviceLinks(origin, restaurant.code)
  return { menu: `${origin}/restaurant/${restaurant.slug}`, tablet: devices.kitchen, waiter: devices.waiter }
}
