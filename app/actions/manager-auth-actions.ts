'use server'

import { managerOtpEmail } from '@/lib/emails/manager-otp-email'
import { requestOtp } from '@/lib/otp-request'
import { otpRequest } from '@/lib/schemas/user'

export async function requestManagerOtp(rawEmail: string, rawPassword: string) {
  const parsed = otpRequest.safeParse({ email: rawEmail, password: rawPassword })
  if (!parsed.success) return { error: 'Invalid email or password' }
  return requestOtp(parsed.data, {
    role: 'RESTAURANT_ADMIN',
    subject: 'Your Foodify Manager verification code',
    html: managerOtpEmail,
    text: (code) => `Your Foodify Manager verification code is ${code}. This code will expire in 10 minutes.`,
    failure: 'Something went wrong. Please try again.',
  })
}
