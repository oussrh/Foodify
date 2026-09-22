'use server'

import { requestOtp, type SignInStart } from '@/lib/otp-request'
import { otpRequest } from '@/lib/schemas/user'

/**
 * The kitchen tablet's sign-in, open to anyone: parses `otpRequest` (two non-empty fields, nothing stricter) and checks
 * the password against a KITCHEN account. A tablet never has a second factor, so `requestOtp` mails nothing and answers
 * `{ success: true, mfa: false }`, which tells the form to sign in with the same credentials at once. One message for
 * every failure of the caller's making, so nothing tells an address from a password or from a manager's account.
 */
export async function requestKitchenSignIn(rawEmail: string, rawPassword: string): Promise<SignInStart> {
  const parsed = otpRequest.safeParse({ email: rawEmail, password: rawPassword })
  if (!parsed.success) return { error: 'Invalid email or password' }
  return requestOtp(parsed.data, {
    role: 'KITCHEN',
    // Never reached: a KITCHEN account has no second factor, so nothing is ever sent.
    subject: 'Your Foodify verification code',
    html: (code) => `<b>${code}</b>`,
    text: (code) => `Your Foodify verification code is ${code}.`,
    failure: 'Database connection failed or other server error',
  })
}
