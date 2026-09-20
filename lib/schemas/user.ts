// lib/schemas/user.ts
// Super admins, restaurant admins ("clients") and the signed-in user's own profile.
import { z } from 'zod'
import { email, password, uuid } from './common'

export const adminInput = z.object({ email, password })
export const adminPatch = z.object({ email: email.optional() })
export type AdminInput = z.infer<typeof adminInput>
export type AdminPatch = z.infer<typeof adminPatch>

export const clientInput = z.object({
  email,
  password,
  restaurantIds: z.array(uuid).optional(),
  restaurantName: z.string().optional(),
})
export const clientPatch = z.object({ email: email.optional(), restaurantIds: z.array(uuid).optional() })
export type ClientInput = z.infer<typeof clientInput>
export type ClientPatch = z.infer<typeof clientPatch>

export const emailChange = z.object({ email })
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
export type PasswordChange = z.infer<typeof passwordChange>
/** `crypto.randomBytes(32).toString('hex')`: the change-email and verify tokens. */
export const emailToken = z.string().regex(/^[0-9a-f]{64}$/, 'Invalid token')

/**
 * The first step of a sign-in. Deliberately loose (VALID.1's carve-out): the stored account is
 * the real gate, and a stricter shape would tell a caller which addresses are worth trying.
 */
export const otpRequest = z.object({ email: z.string().min(1), password: z.string().min(1) })
/** What NextAuth's credentials provider receives; `role` is the portal the sign-in page serves. */
export const credentials = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  code: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'RESTAURANT_ADMIN']).optional(),
})
