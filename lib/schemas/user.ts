// lib/schemas/user.ts
// Super admins, restaurant admins ("clients") and the signed-in user's own profile.
import { z } from 'zod'
import { email, password, uuid } from './common'

/** A new super admin: the address and the temporary `password` (six characters, meant to be changed; nothing enforces the change yet). */
export const adminInput = z.object({ email, password })
/** From the admin panel only the address of a super admin changes; a password goes through resetAdminPassword, a role never. */
export const adminPatch = z.object({ email: email.optional() })
/** A new super admin: an email and the temporary password the creating admin sets. */
export type AdminInput = z.infer<typeof adminInput>
/** What can change on a super admin from the admin panel: the email only; the password goes through resetAdminPassword. */
export type AdminPatch = z.infer<typeof adminPatch>

/**
 * A new restaurant admin. `restaurantIds` assigns existing restaurants; `restaurantName` makes one
 * and assigns it with the others; that restaurant is written first, so a taken email leaves it
 * without an admin (createClient).
 */
export const clientInput = z.object({
  email,
  password,
  restaurantIds: z.array(uuid).optional(),
  restaurantName: z.string().optional(),
})
/** What the admin panel can change on a restaurant admin: the address and the whole set of assigned restaurants (a `restaurantIds` sent replaces the set, one left out keeps it). */
export const clientPatch = z.object({ email: email.optional(), restaurantIds: z.array(uuid).optional() })
/** A new restaurant admin: credentials, the restaurants to assign, and optionally a restaurant to create for them at the same time. */
export type ClientInput = z.infer<typeof clientInput>
/** What can change on a restaurant admin from the admin panel: the email and the assigned restaurants. */
export type ClientPatch = z.infer<typeof clientPatch>

/** The address a manager asks to move to; not checked for being taken, here or by initiateEmailChange: a taken one fails at the confirmation, on the unique constraint. */
export const emailChange = z.object({ email })
/** The address a manager asks to move to; the two-step confirmation lives in profile-actions. */
export type EmailChange = z.infer<typeof emailChange>
/** The signed-in user's own change: the current password, then a strong new one (an admin-set one is temporary and only six characters). */
export const passwordChange = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
})
/** What `passwordChange` parses: the current password to prove identity and the new one that met the strength rules. */
export type PasswordChange = z.infer<typeof passwordChange>
/** `crypto.randomBytes(32).toString('hex')`: the change-email and verify tokens. */
export const emailToken = z.string().regex(/^[0-9a-f]{64}$/, 'Invalid token')

/**
 * The first step of a sign-in. Deliberately loose (VALID.1's carve-out): the stored account is
 * the real gate, and a stricter shape would tell a caller which addresses are worth trying.
 */
export const otpRequest = z.object({ email: z.string().min(1), password: z.string().min(1) })
/** The parsed first step of a sign-in; `requestOtp` in lib/otp-request takes it after the action's parse. */
export type OtpRequest = z.infer<typeof otpRequest>
/** What NextAuth's credentials provider receives; `role` is the portal the sign-in page serves. */
export const credentials = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  code: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'RESTAURANT_ADMIN']).optional(),
})
