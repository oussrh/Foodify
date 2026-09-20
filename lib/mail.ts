// lib/mail.ts
// The one place that talks to Resend. Without a key (local development, CI) nothing is sent and
// the caller is told; it decides what that means for its flow.
import { Resend } from 'resend'
import { serverEnv } from '@/lib/env'

export type Mail = { to: string; subject: string; html: string; text?: string }

export async function sendMail(mail: Mail): Promise<{ sent: boolean }> {
  const { resendApiKey, resendFrom } = serverEnv
  if (!resendApiKey || !resendFrom) return { sent: false }
  await new Resend(resendApiKey).emails.send({ from: resendFrom, ...mail })
  return { sent: true }
}
