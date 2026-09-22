// lib/otp-request.ts
// The first step of both sign-ins, after the action's parse: the account and password are
// checked, then, for an account with the second factor on, a six-digit code is stored for ten
// minutes and mailed; with it off nothing is sent and the caller learns it may sign in at once.
// One message for every failure of the caller's making, so nothing tells an address from a password.
import bcrypt from 'bcryptjs'
import { randomInt } from 'crypto'
import prisma from '@/lib/prisma'
import { sendMail } from '@/lib/mail'
import { accountFor } from '@/lib/sign-in-checks'
import type { OtpRequest } from '@/lib/schemas/user'
import { log } from '@/server/log'

/** How long a mailed sign-in code stays valid; the two OTP mails (lib/emails) say "ten minutes", so the three move together. */
export const OTP_TTL_MS = 10 * 60 * 1000

type Portal = {
  role: 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'KITCHEN' | 'WAITER'
  subject: string
  html: (code: string) => string
  text: (code: string) => string
  /** What the caller hears when the server, not the caller, failed. */
  failure: string
}

/**
 * What the first step of a sign-in answers, whichever portal asked: the credentials were good
 * and a code is (or is not) waiting, or they were not. One type for all four portals, so the
 * form can read the answer without knowing which action it called.
 */
export type SignInStart = { success: true; mfa: boolean } | { error: string }

/**
 * The parsed credentials of one portal's sign-in: the action parses, this does the rest. Answers `{ success, mfa }`:
 * `mfa: true` when a code was mailed and the sign-in needs it next, `mfa: false` when the account has the second
 * factor off and the same credentials open the session now (nothing is stored or sent).
 */
export async function requestOtp({ email, password }: OtpRequest, portal: Portal): Promise<SignInStart> {
  try {
    // `email` is whatever was typed: a person's address, or a device's username.
    const user = await accountFor(email)
    if (!user || user.role !== portal.role || !(await bcrypt.compare(password, user.passwordHash))) {
      return { error: 'Invalid email or password' }
    }
    if (!user.mfaEnabled) return { success: true, mfa: false }
    const code = randomInt(100000, 1000000).toString()
    await prisma.user.update({
      where: { id: user.id },
      data: { emailOtpCode: code, emailOtpExpires: new Date(Date.now() + OTP_TTL_MS) },
    })
    await sendMail({ to: user.email, subject: portal.subject, html: portal.html(code), text: portal.text(code) })
    return { success: true, mfa: true }
  } catch (error) {
    log.error({ err: error, portal: portal.role }, 'otp request: failed')
    return { error: portal.failure }
  }
}
