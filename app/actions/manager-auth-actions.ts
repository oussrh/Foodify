'use server'

import prisma from '@/lib/prisma'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'

export async function requestManagerOtp(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return { error: 'User not found. Please check your email address.' }
    }
    if (user.role !== 'RESTAURANT_ADMIN') {
      return { error: `Access denied. Manager access required.` }
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
        subject: 'Your Foodify Manager verification code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f97316;">Foodify Manager Login</h2>
            <p>Your verification code is:</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">${code}</span>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
        text: `Your Foodify Manager verification code is ${code}. This code will expire in 10 minutes.`,
      })
    }
    return { success: true }
  } catch (error) {
    console.error('Manager OTP request error:', error)
    return { error: 'Something went wrong. Please try again.' }
  }
}