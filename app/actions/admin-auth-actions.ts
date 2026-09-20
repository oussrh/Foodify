'use server'

import { superAdminOtpEmail } from '@/lib/emails/super-admin-otp-email'
import { requestOtp } from '@/lib/otp-request'
import { otpRequest } from '@/lib/schemas/user'

export async function requestAdminOtp(rawEmail: string, rawPassword: string) {
  const parsed = otpRequest.safeParse({ email: rawEmail, password: rawPassword })
  if (!parsed.success) return { error: 'Invalid email or password' }
  return requestOtp(parsed.data, {
    role: 'SUPER_ADMIN',
    subject: 'Your Foodify verification code',
    html: superAdminOtpEmail,
    text: (code) => `Your Foodify verification code is ${code}. This code will expire in 10 minutes.`,
    failure: 'Database connection failed or other server error',
  })
}
