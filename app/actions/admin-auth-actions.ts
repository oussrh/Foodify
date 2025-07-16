'use server'

import prisma from '@/lib/prisma'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'

export async function requestAdminOtp(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.role !== 'SUPER_ADMIN') {
    return { error: 'Invalid credentials' }
  }
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return { error: 'Invalid credentials' }
  }
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailOtpCode: code,
      emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    },
  })
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: email,
      subject: 'Your Foodify verification code',
      text: `Your verification code is ${code}`,
    })
  }
  return { success: true }
}
