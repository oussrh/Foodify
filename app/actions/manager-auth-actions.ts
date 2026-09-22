'use server'

import { managerOtpEmail } from '@/lib/emails/manager-otp-email'
import { requestOtp, type SignInStart } from '@/lib/otp-request'
import { otpRequest } from '@/lib/schemas/user'

/**
 * The manager sign-in's first step, open to anyone: parses `otpRequest` (two non-empty fields, nothing stricter) and
 * mails a ten-minute code to a RESTAURANT_ADMIN account whose password matches; a super admin is refused here, unlike at
 * the credentials step. Answers `{ success }` or `{ error }`, one message for every failure of the caller's making.
 */
export async function requestManagerOtp(rawEmail: string, rawPassword: string): Promise<SignInStart> {
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
