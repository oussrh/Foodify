'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { randomInt } from 'crypto'
import { superAdminOtpEmail } from '@/lib/emails/super-admin-otp-email'
import { sendMail } from '@/lib/mail'
import { otpRequest } from '@/lib/schemas/user'

export async function requestAdminOtp(rawEmail: string, rawPassword: string) {
  try {
    const { email, password } = otpRequest.parse({ email: rawEmail, password: rawPassword })
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return { error: 'Invalid email or password' }
    }
    if (user.role !== 'SUPER_ADMIN') {
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
      subject: 'Your Foodify verification code',
      html: superAdminOtpEmail(code),
      text: `Your Foodify verification code is ${code}. This code will expire in 10 minutes.`,
    })
    return { success: true }
  } catch (error) {
    console.error('Admin OTP request error:', error)
    return { error: 'Database connection failed or other server error' }
  }
}
