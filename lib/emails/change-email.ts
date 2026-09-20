import { serverEnv } from '@/lib/env'

export function oldEmailConfirmationEmail(token: string) {
  const url = `${serverEnv.authUrl}/manager/change-email/confirm-old?token=${token}`
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color:#f97316;">Confirm Email Change</h2>
      <p>Click the button below to confirm you requested to change your email.</p>
      <p style="text-align:center; margin:20px 0;">
        <a href="${url}" style="background-color:#f97316;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;">Confirm</a>
      </p>
      <p>This link will expire in 15 minutes.</p>
    </div>
  `
}

export function newEmailVerificationEmail(token: string) {
  const url = `${serverEnv.authUrl}/manager/change-email/confirm-new?token=${token}`
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color:#f97316;">Verify New Email</h2>
      <p>Please verify your new email by clicking the button below.</p>
      <p style="text-align:center; margin:20px 0;">
        <a href="${url}" style="background-color:#10b981;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;">Verify Email</a>
      </p>
      <p>This link will expire in 15 minutes.</p>
    </div>
  `
}
