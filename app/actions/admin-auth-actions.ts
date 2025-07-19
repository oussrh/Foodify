'use server'

import prisma from '@/lib/prisma'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'
import { superAdminOtpEmail } from '@/lib/emails/super-admin-otp-email'

export async function requestAdminOtp(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return { error: 'User not found. Database may not be seeded.' }
    }
    if (user.role !== 'SUPER_ADMIN') {
      return { error: `User found but role is ${user.role}, not SUPER_ADMIN` }
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return { error: 'Invalid password' }
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
        html: superAdminOtpEmail(code),
        text: `Your Foodify verification code is ${code}. This code will expire in 10 minutes.`,
      })
    }
    return { success: true }
  } catch (error) {
    console.error('Admin OTP request error:', error)
    return { error: 'Database connection failed or other server error' }
  }
}
