// lib/schemas/user.ts
// Super admins, restaurant admins ("clients") and the signed-in user's own profile.
import { z } from 'zod'
import { MAX_NAME, email, password, uuid } from './common'
import { listQuery } from './list'

/** A new super admin: the address and the temporary `password` (six characters, meant to be changed; nothing enforces the change yet). */
export const adminInput = z.object({ email, password })
/** From the admin panel only the address of a super admin changes; a password goes through resetAdminPassword, a role never. */
export const adminPatch = z.object({ email: email.optional() })
/** `adminInput` after parsing. */
export type AdminInput = z.infer<typeof adminInput>
/** `adminPatch` after parsing. */
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
  restaurantName: z.string().trim().max(MAX_NAME, `At most ${MAX_NAME} characters`).optional(),
})
/** What the admin panel can change on a restaurant admin: the address and the whole set of assigned restaurants (a `restaurantIds` sent replaces the set, one left out keeps it). */
export const clientPatch = z.object({ email: email.optional(), restaurantIds: z.array(uuid).optional() })
/** `clientInput` after parsing. */
export type ClientInput = z.infer<typeof clientInput>
/** `clientPatch` after parsing. */
export type ClientPatch = z.infer<typeof clientPatch>

/**
 * A manager added to one restaurant from its People tab, by address. The address is typed rather
 * than picked: a list of candidates is every other client's managers, which one restaurant may
 * not see. `password` is read only when the address is new here — an account that already exists
 * keeps the password it has, and joins the restaurant with it.
 */
export const restaurantManager = z.object({ email, password: password.optional() })
/** `restaurantManager` after parsing. */
export type RestaurantManager = z.infer<typeof restaurantManager>

/** The address a manager asks to move to; not checked for being taken, here or by initiateEmailChange: a taken one fails at the confirmation, on the unique constraint. */
export const emailChange = z.object({ email })
/** `emailChange` after parsing. */
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
/** `passwordChange` after parsing; `updatePassword` takes it after the action's parse. */
export type PasswordChange = z.infer<typeof passwordChange>
/** The signed-in user's own second-factor switch (Account settings, both portals); `setMfaEnabled` takes it after the action's parse. */
export const mfaSetting = z.object({ mfaEnabled: z.boolean() })
/** `mfaSetting` after parsing. */
export type MfaSetting = z.infer<typeof mfaSetting>
/** `crypto.randomBytes(32).toString('hex')`: the change-email and verify tokens. */
export const emailToken = z.string().regex(/^[0-9a-f]{64}$/, 'Invalid token')

/**
 * The first step of a sign-in. Deliberately loose (VALID.1's carve-out): the stored account is
 * the real gate, and a stricter shape would tell a caller which addresses are worth trying.
 */
export const otpRequest = z.object({ email: z.string().min(1).max(320), password: z.string().min(1).max(200) })
/** `otpRequest` after parsing; `requestOtp` in lib/otp-request takes it after the action's parse. */
export type OtpRequest = z.infer<typeof otpRequest>
/** What NextAuth's credentials provider receives; `role` is the portal the sign-in page serves. */
export const credentials = z.object({
  email: z.string().min(1).max(320),
  password: z.string().min(1).max(200),
  // Six digits (the emailed code and a TOTP alike), else no code at all: NextAuth posts a missing
  // one as the text "undefined", which must read as absent and not refuse a sign-in without the factor.
  code: z
    .string()
    .optional()
    .transform((v) => (v && /^\d{6}$/.test(v) ? v : undefined)),
  role: z.enum(['SUPER_ADMIN', 'RESTAURANT_ADMIN', 'KITCHEN', 'WAITER']).optional(),
})

/**
 * GET /api/users: a page of `listQuery` and an optional `role` to filter on, one of the two
 * portal roles. Any other role is refused (400), not read as no filter: a typo must not widen the list.
 */
export const userListQuery = listQuery.extend({ role: z.enum(['SUPER_ADMIN', 'RESTAURANT_ADMIN']).optional() })

/** The code a person types at the second step of a sign-in: six digits, the emailed code and a TOTP alike (what `credentials.code` keeps). */
export const otpCode = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code')
