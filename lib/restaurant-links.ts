// lib/restaurant-links.ts
// The addresses one restaurant runs on. Each is going to a different device — a guest's phone, a
// tablet on the pass, a waiter's phone — so all three are absolute, built from the public origin
// rather than from whatever host the portal happens to be open on.

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
 * The three addresses, absolute. The device ones are by id, not slug: a tablet signed in stays on
 * its board across a rename, where a slug would break the tab someone left open on the pass.
 */
export function restaurantLinks(origin: string, restaurant: { id: string; slug: string }): RestaurantLinks {
  return {
    menu: `${origin}/restaurant/${restaurant.slug}`,
    tablet: `${origin}/kitchen/orders/${restaurant.id}`,
    waiter: `${origin}/waiter/${restaurant.id}`,
  }
}
