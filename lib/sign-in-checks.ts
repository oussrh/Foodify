// lib/sign-in-checks.ts
// What the credentials provider (auth.ts) checks once the form is parsed, in order: the account
// and its password, the portal the sign-in page serves, then the second factor. A failed
// account or password is null (logged); a wrong portal or code throws the message the form shows.
import bcrypt from 'bcryptjs'
import type { User } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { safeEqual, verifyTOTP } from '@/lib/totp'

/** The account whose password matches, or null when there is no such account or the password is wrong. */
export async function userWithPassword(email: string, password: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log('User not found:', email)
    return null
  }
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    console.log('Invalid password for user:', email)
    return null
  }
  return user
}

/** The portal the sign-in page serves, when it names one; a super admin may use either. */
export function assertPortalRole(user: User, role: string | undefined): void {
  if (!role) return
  if (user.role !== role && user.role !== 'SUPER_ADMIN') {
    console.log('Role mismatch for user:', user.email, 'expected:', role, 'actual:', user.role)
    throw new Error('Unauthorized role')
  }
}

/**
 * The second factor and the login stamp: a pending emailed code must match and be unexpired
 * (it is consumed), else a TOTP secret must verify the code, else there is no second factor.
 * The last login is stamped whichever applies.
 */
export async function completeSecondFactor(user: User, code: string | undefined): Promise<void> {
  if (user.emailOtpCode) {
    const expired = user.emailOtpExpires && user.emailOtpExpires < new Date()
    if (!code || !safeEqual(code, user.emailOtpCode) || expired) {
      throw new Error('Invalid two-factor code')
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { emailOtpCode: null, emailOtpExpires: null, lastLogin: new Date() },
    })
    return
  }
  if (user.totpSecret && (!code || !verifyTOTP(code, user.totpSecret))) {
    throw new Error('Invalid two-factor code')
  }
  // Update last login even without 2FA
  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } })
}
