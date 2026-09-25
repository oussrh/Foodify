// lib/restaurant-paths.ts
// The addresses of one restaurant's screens, built in one place. Every one of them names the
// restaurant by its short code (`lib/restaurant-code.ts`), the portals' tabs as much as the
// devices: one address per page, six characters to read over a shoulder rather than thirty-six.
// The routes still accept a uuid (a portal page answers it with a permanent redirect to the code,
// a device page opens it as it is), so a link saved before codes existed keeps working.
import type { Route } from 'next'

/** The two portals whose restaurant pages live under `/{portal}/restaurants/<code>`. */
export type RestaurantPortal = 'admin' | 'manager'

/** The tabs of a restaurant in the portals, in the order the tab strip shows them (`edit` is Settings, `users` is People). */
export const RESTAURANT_TABS = ['info', 'menu', 'dishes', 'orders', 'tables', 'insights', 'edit', 'users'] as const

/** A restaurant page under `/{portal}/restaurants/<code>/`: one of its tabs, or a dish's create and edit forms. */
export type RestaurantPage = (typeof RESTAURANT_TABS)[number] | 'dishes/create' | `dishes/${string}/edit`

/** The tab a path's section names, or the Info tab for anything that is not one (the switcher keeps the reader's tab). */
export function restaurantTab(section: string | undefined): (typeof RESTAURANT_TABS)[number] {
  return RESTAURANT_TABS.find((tab) => tab === section) ?? 'info'
}

/**
 * A portal's page for one restaurant, the Info tab by default; `query` (already encoded, without
 * the `?`) is kept on it when there is one.
 */
export function restaurantPath(portal: RestaurantPortal, code: string, page: RestaurantPage = 'info', query = ''): Route {
  return `/${portal}/restaurants/${code}/${page}${query ? `?${query}` : ''}` as Route
}

/** A portal's kitchen board for one restaurant, outside the shell: `/{portal}/orders/<code>`. */
export function portalBoardPath(portal: RestaurantPortal, code: string): Route {
  return `/${portal}/orders/${code}` as Route
}

/**
 * The order tablet's board. `ref` is the restaurant as the link names it (the code, or the uuid an
 * older link carried), kept as given, because it is also the installed app's address.
 */
export function kitchenBoardPath(ref: string): Route {
  return `/kitchen/${ref}` as Route
}

/** The order tablet's sold-out screen, beside its board: `/kitchen/<ref>/menu`. */
export function kitchenMenuPath(ref: string): Route {
  return `/kitchen/${ref}/menu` as Route
}

/** The waiter's app for one restaurant: its tables, at `/waiter/<ref>`. */
export function waiterPath(ref: string): Route {
  return `/waiter/${ref}` as Route
}

/**
 * The words under `/kitchen/` that are screens or old addresses, never a restaurant: `orders`
 * would otherwise fold onto the code 0RDERS and be looked up. Matched in any case.
 */
const KITCHEN_WORDS = ['orders', 'menu', 'login']

/** Whether a `/kitchen/[id]` segment is one of the kitchen's own words rather than a restaurant: the page's 404. */
export function isKitchenWord(segment: string): boolean {
  return KITCHEN_WORDS.includes(segment.toLowerCase())
}

/** The two device links a restaurant hands out, absolute from `origin`: the kitchen tablet's and the waiter's phone's. */
export function deviceLinks(origin: string, code: string): { kitchen: string; waiter: string } {
  return { kitchen: `${origin}${kitchenBoardPath(code)}`, waiter: `${origin}${waiterPath(code)}` }
}
