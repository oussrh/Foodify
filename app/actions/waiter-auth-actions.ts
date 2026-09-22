'use server'

import { requestOtp, type SignInStart } from '@/lib/otp-request'
import { otpRequest } from '@/lib/schemas/user'

/**
 * The waiter's sign-in, open to anyone: parses `otpRequest` (two non-empty fields, nothing stricter) and checks the
 * password against a WAITER account. A waiter's phone is in their apron, not at a desk, so the account has no second
 * factor: `requestOtp` mails nothing and answers `{ success: true, mfa: false }`, which signs them in at once. One
 * message for every failure of the caller's making.
 */
export async function requestWaiterSignIn(rawEmail: string, rawPassword: string): Promise<SignInStart> {
  const parsed = otpRequest.safeParse({ email: rawEmail, password: rawPassword })
  if (!parsed.success) return { error: 'Invalid email or password' }
  return requestOtp(parsed.data, {
    role: 'WAITER',
    // Never reached: a WAITER account has no second factor, so nothing is ever sent.
    subject: 'Your Foodify verification code',
    html: (code) => `<b>${code}</b>`,
    text: (code) => `Your Foodify verification code is ${code}.`,
    failure: 'Database connection failed or other server error',
  })
}
