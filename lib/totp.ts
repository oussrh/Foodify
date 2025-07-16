import { authenticator } from 'otplib'

export function verifyTOTP(token: string, secret: string) {
  try {
    return authenticator.check(token, secret)
  } catch {
    return false
  }
}
