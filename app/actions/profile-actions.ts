'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import crypto from 'crypto'
import {
  oldEmailConfirmationEmail,
  newEmailVerificationEmail,
} from '@/lib/emails/change-email'

export async function initiateEmailChange(email: string, ip?: string) {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }
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
      ipAddress: ip,
    },
  })

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: user.email,
      subject: 'Confirm your email change',
      html: oldEmailConfirmationEmail(token),
    })
  }
}

export async function confirmOldEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      emailChangeToken: token,
      emailChangeTokenExpires: { gt: new Date() },
    },
  })
  if (!user || !user.newEmail) return null

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

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: user.newEmail,
      subject: 'Verify your new email',
      html: newEmailVerificationEmail(verifyToken),
    })
  }

  return true
}

export async function confirmNewEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: token,
      emailVerifyTokenExpires: { gt: new Date() },
    },
  })
  if (!user || !user.newEmail) return null

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

  return true
}

export async function updatePassword(password: string) {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }
  const passwordHash = await bcrypt.hash(password, 10)
  return prisma.user.update({
    where: { email: session.user.email },
    data: { passwordHash },
  })
}
