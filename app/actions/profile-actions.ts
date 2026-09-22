'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import {
  oldEmailConfirmationEmail,
  newEmailVerificationEmail,
} from '@/lib/emails/change-email'
import { requireUser } from '@/lib/auth-guard'
import { isDeviceAccount } from '@/lib/roles'
import { sendMail } from '@/lib/mail'
import { emailChange, emailToken, mfaSetting, passwordChange, type MfaSetting, type PasswordChange } from '@/lib/schemas/user'
import { userPayload } from '@/lib/payloads'

/**
 * The signed-in user of either portal, for their own account only. Parses `emailChange` (a valid address, not checked for
 * being taken), stores it as `newEmail` behind a fifteen-minute token, logs the change as pending and mails the first link
 * to the OLD address; the email itself is untouched until both links are followed. Answers the mailer's `{ sent }`.
 */
export async function initiateEmailChange(rawEmail: string) {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }
  const { email } = emailChange.parse({ email: rawEmail })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) throw new Error('User not found')

  const token = crypto.randomBytes(32).toString('hex')

  await prisma.user.update({
    where: { id: user.id },
    data: {
      newEmail: email,
      emailChangeToken: token,
      emailChangeTokenExpires: new Date(Date.now() + 15 * 60 * 1000),
      emailVerifyToken: null,
      emailVerifyTokenExpires: null,
    },
  })

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'email_change_initiated',
      oldEmail: user.email,
      newEmail: email,
      status: 'pending',
    },
  })

  const { sent } = await sendMail({ to: user.email, subject: 'Confirm your email change', html: oldEmailConfirmationEmail(token) })
  return { sent }
}

/**
 * Open to whoever holds the link: the token is the credential, no session is read. Parses `emailToken` (64 hex chars); a
 * mangled, unknown or expired token answers `{ confirmed: false }` alike. Swaps in a fifteen-minute verify token, logs
 * `confirmed_old`, mails the second link to the NEW address and answers `{ confirmed: true, sent }`.
 */
export async function confirmOldEmail(rawToken: string) {
  // A mangled link is the same "invalid or expired" as an unknown token, not a render error.
  const parsed = emailToken.safeParse(rawToken)
  if (!parsed.success) return { confirmed: false }
  const token = parsed.data
  const user = await prisma.user.findFirst({
    where: {
      emailChangeToken: token,
      emailChangeTokenExpires: { gt: new Date() },
    },
  })
  if (!user || !user.newEmail) return { confirmed: false }

  const verifyToken = crypto.randomBytes(32).toString('hex')

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailChangeToken: null,
      emailChangeTokenExpires: null,
      emailVerifyToken: verifyToken,
      emailVerifyTokenExpires: new Date(Date.now() + 15 * 60 * 1000),
    },
  })

  await prisma.activityLog.updateMany({
    where: {
      userId: user.id,
      action: 'email_change_initiated',
      status: 'pending',
    },
    data: { status: 'confirmed_old' },
  })

  const { sent } = await sendMail({ to: user.newEmail, subject: 'Verify your new email', html: newEmailVerificationEmail(verifyToken) })

  return { confirmed: true, sent }
}

/**
 * Open to whoever holds the link: the token is the credential, no session is read. Parses `emailToken`; a mangled, unknown
 * or expired token answers `{ confirmed: false }`. Makes `newEmail` the account's email (one taken meanwhile is Prisma's
 * unique error), logs `confirmed_new`, answers `{ confirmed: true }`; the JWT session shows the old address until re-sign-in.
 */
export async function confirmNewEmail(rawToken: string) {
  const parsed = emailToken.safeParse(rawToken)
  if (!parsed.success) return { confirmed: false }
  const token = parsed.data
  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: token,
      emailVerifyTokenExpires: { gt: new Date() },
    },
  })
  if (!user || !user.newEmail) return { confirmed: false }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: user.newEmail,
      newEmail: null,
      emailVerifyToken: null,
      emailVerifyTokenExpires: null,
    },
  })

  await prisma.activityLog.updateMany({
    where: {
      userId: user.id,
      action: 'email_change_initiated',
      status: 'confirmed_old',
    },
    data: { status: 'confirmed_new' },
  })

  return { confirmed: true }
}

/**
 * The signed-in user of either portal, for their own account only. Parses `passwordChange` (the current password and a
 * strong new one: eight characters with upper, lower, digit and symbol), throws 'Current password is incorrect' when the
 * current one does not match the hash, stores the new hash, logs `password_changed` and answers `userPayload`; a
 * FORCE_CHANGE stamp stays.
 */
export async function updatePassword(raw: PasswordChange) {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }
  const { currentPassword, password } = passwordChange.parse(raw)
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new Error('Current password is incorrect')
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const [updated] = await prisma.$transaction([
    prisma.user.update({ select: userPayload, where: { id: user.id }, data: { passwordHash } }),
    prisma.activityLog.create({ data: { userId: user.id, action: 'password_changed', status: 'done' } }),
  ])
  return updated
}

/**
 * The signed-in user of either portal, for their own account only. Parses `mfaSetting` and stores the choice: on, every
 * sign-in asks for the emailed code (or the authenticator, when one is set) after the password; off, the password alone
 * opens a session, and a device account (an order tablet, a waiter) is refused outright: its address is unroutable, so
 * a second factor would lock it out for good. A pending emailed code is
 * dropped either way, so a code sent under the old setting is spent; the
 * change is logged (`two_factor_enabled` / `two_factor_disabled`, what the account page lists). Answers `{ id, mfaEnabled }`.
 */
export async function setMfaEnabled(raw: MfaSetting) {
  const me = await requireUser()
  // A device signs in with a password and nothing else. Turning a second factor on for one would
  // lock it out for good: the code is mailed, and its address is on the unroutable `.invalid`.
  if (isDeviceAccount(me.role)) throw new Error('A device account cannot use two-factor authentication')
  const { mfaEnabled } = mfaSetting.parse(raw)
  const [updated] = await prisma.$transaction([
    prisma.user.update({
      select: { id: true, mfaEnabled: true },
      where: { id: me.id },
      data: { mfaEnabled, emailOtpCode: null, emailOtpExpires: null },
    }),
    prisma.activityLog.create({ data: { userId: me.id, action: mfaEnabled ? 'two_factor_enabled' : 'two_factor_disabled', status: 'done' } }),
  ])
  return updated
}
