'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { randomInt } from 'crypto'
import { managerOtpEmail } from '@/lib/emails/manager-otp-email'
import { sendMail } from '@/lib/mail'

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
    
    await sendMail({
      to: email,
      subject: 'Your Foodify Manager verification code',
      html: managerOtpEmail(code),
      text: `Your Foodify Manager verification code is ${code}. This code will expire in 10 minutes.`,
    })
    return { success: true }
  } catch (error) {
    console.error('Manager OTP request error:', error)
    return { error: 'Something went wrong. Please try again.' }
  }
}