// lib/otp-request.ts
// The first step of both sign-ins, after the action's parse: the account and password are
// checked, a six-digit code is stored for ten minutes and mailed. One message for every failure
// of the caller's making, so nothing tells an address from a password.
import bcrypt from 'bcryptjs'
import { randomInt } from 'crypto'
import prisma from '@/lib/prisma'
import { sendMail } from '@/lib/mail'
import type { OtpRequest } from '@/lib/schemas/user'

/** How long a mailed sign-in code stays valid; the two OTP mails (lib/emails) say "ten minutes", so the three move together. */
export const OTP_TTL_MS = 10 * 60 * 1000

type Portal = {
  role: 'SUPER_ADMIN' | 'RESTAURANT_ADMIN'
  subject: string
  html: (code: string) => string
  text: (code: string) => string
  /** What the caller hears when the server, not the caller, failed. */
  failure: string
}

/** The parsed credentials of one portal's sign-in: the action parses, this does the rest. */
export async function requestOtp({ email, password }: OtpRequest, portal: Portal) {
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.role !== portal.role || !(await bcrypt.compare(password, user.passwordHash))) {
      return { error: 'Invalid email or password' }
    }
    const code = randomInt(100000, 1000000).toString()
    await prisma.user.update({
      where: { id: user.id },
      data: { emailOtpCode: code, emailOtpExpires: new Date(Date.now() + OTP_TTL_MS) },
    })
    await sendMail({ to: email, subject: portal.subject, html: portal.html(code), text: portal.text(code) })
    return { success: true }
  } catch (error) {
    console.error(`${portal.role} OTP request error:`, error)
    return { error: portal.failure }
  }
}
