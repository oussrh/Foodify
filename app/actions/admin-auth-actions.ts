'use server'

import { superAdminOtpEmail } from '@/lib/emails/super-admin-otp-email'
import { requestOtp, type SignInStart } from '@/lib/otp-request'
import { otpRequest } from '@/lib/schemas/user'

/**
 * The super-admin sign-in's first step, open to anyone: parses `otpRequest` (two non-empty fields, nothing stricter)
 * and mails a ten-minute code to a SUPER_ADMIN account whose password matches. Answers `{ success }` or `{ error }`,
 * one message for every failure of the caller's making, so nothing tells an address from a password or a manager's account.
 */
export async function requestAdminOtp(rawEmail: string, rawPassword: string): Promise<SignInStart> {
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
