'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import {
  oldEmailConfirmationEmail,
  newEmailVerificationEmail,
} from '@/lib/emails/change-email'
import { sendMail } from '@/lib/mail'
import { emailChange, emailToken, passwordChange, type PasswordChange } from '@/lib/schemas/user'
import { userPayload } from '@/lib/payloads'

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
  return prisma.user.update({ select: userPayload,
    where: { id: user.id },
    data: { passwordHash },
  })
}
