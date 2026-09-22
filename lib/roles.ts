// lib/roles.ts
// What each role is called on screen, in one place. The stored values are the database's
// (`UserRole`), which nobody but the code should ever read: a list that shows RESTAURANT_ADMIN or
// KITCHEN is asking its reader to translate. `KITCHEN` is an order tablet — a device on the pass,
// not a person — and it is named that way wherever it is shown.
import type { UserRole } from '@/generated/prisma/client'

/** The name a role goes by on screen. */
export const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super admin',
  RESTAURANT_ADMIN: 'Restaurant manager',
  KITCHEN: 'Order tablet',
  WAITER: 'Waiter',
}

/** One line saying what a role may do, for a list that shows accounts of more than one kind. */
export const ROLE_DESCRIPTION: Record<UserRole, string> = {
  SUPER_ADMIN: 'Every restaurant on the platform.',
  RESTAURANT_ADMIN: 'This restaurant: its menu, its dishes and its settings.',
  KITCHEN: 'This restaurant\'s orders, and nothing else.',
  WAITER: 'Takes orders at the table and reads the board; the kitchen moves them along.',
}

/**
 * The roles that are devices rather than people: they sign in with a username, have no mailbox
 * (their address is on the unroutable `staff.invalid`), and must never be offered anything that
 * would send them mail. A second factor for one of these is a lock-out, not a protection.
 */
export const DEVICE_ROLES = ['KITCHEN', 'WAITER'] as const satisfies readonly UserRole[]

/** Whether this account is a device: no mailbox, so nothing may be sent to it. */
export function isDeviceAccount(role: string): boolean {
  return (DEVICE_ROLES as readonly string[]).includes(role)
}

/** Where an account belongs when it lands somewhere it may not be; every role has a home. */
export const ROLE_HOME: Record<UserRole, string> = {
  SUPER_ADMIN: '/admin',
  RESTAURANT_ADMIN: '/manager',
  KITCHEN: '/kitchen',
  WAITER: '/waiter',
}

/** The name a role goes by on screen, for a value read from a session or an old row. */
export function roleLabel(role: string): string {
  return ROLE_LABEL[role as UserRole] ?? role
}
