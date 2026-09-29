/** The two portals the one shell serves; the portal changes data scope, not components. */
export type ShellPortal = 'admin' | 'manager'

export interface ShellRestaurant {
  id: string
  /** The short code every restaurant page's address carries (`/{portal}/restaurants/<code>/…`). */
  code: string
  name: string
}
