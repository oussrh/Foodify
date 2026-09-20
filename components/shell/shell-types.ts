/** The two portals the one shell serves; the role changes data scope, not components. */
export type ShellRole = 'admin' | 'manager'

export interface ShellRestaurant {
  id: string
  name: string
}
