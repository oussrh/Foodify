'use server'

import prisma from '@/lib/prisma'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'
import { randomInt } from 'crypto'
import { managerOtpEmail } from '@/lib/emails/manager-otp-email'

export async function requestManagerOtp(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return { error: 'Invalid email or password' }
    }
    if (user.role !== 'RESTAURANT_ADMIN') {
      return { error: 'Invalid email or password' }
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return { error: 'Invalid email or password' }
    }
    
    const code = randomInt(100000, 1000000).toString()
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
        subject: 'Your Foodify Manager verification code',
        html: managerOtpEmail(code),
        text: `Your Foodify Manager verification code is ${code}. This code will expire in 10 minutes.`,
      })
    }
    return { success: true }
  } catch (error) {
    console.error('Manager OTP request error:', error)
    return { error: 'Something went wrong. Please try again.' }
  }
}