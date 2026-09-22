// lib/schemas/staff.ts
// The two accounts a restaurant has that are not people with portals: the order tablet on the
// pass and the waiter on the floor. Both sign in with a name and a password and nothing else,
// so they share one shape.
import { z } from 'zod'
import { password, username } from './common'

/** The roles these actions may create; every other role is made elsewhere, under its own guard. */
export const staffRole = z.enum(['KITCHEN', 'WAITER'])
/** `staffRole` after parsing. */
export type StaffRole = z.infer<typeof staffRole>

/**
 * A staff account: the name typed into the device and the password set with it. There is no
 * address, because there is no mailbox — nothing is ever sent to a tablet or a waiter, and they
 * never get a second factor.
 */
export const staffAccount = z.object({ username, password })
/** `staffAccount` after parsing. */
export type StaffAccount = z.infer<typeof staffAccount>
