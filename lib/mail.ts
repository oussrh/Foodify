// lib/mail.ts
// The one place that talks to Resend. Without a key (local development, CI) nothing is sent and
// the caller is told; it decides what that means for its flow.
import { Resend } from 'resend'
import { serverEnv } from '@/lib/env'
import { log } from '@/server/log'

/** One message as a caller composes it; `from` is not here because the env holds it, and `text` is the optional plain-text alternative. */
export type Mail = { to: string; subject: string; html: string; text?: string }

/**
 * Sends, or reports that it could not. The result is the caller's to act on: the sign-in and
 * change-email flows keep going without mail (a code or link nobody receives is a dead end the
 * user sees), which is the local setup, not a silent production failure the env refuses.
 */
export async function sendMail(mail: Mail): Promise<{ sent: boolean }> {
  const { resendApiKey, resendFrom } = serverEnv
  if (!resendApiKey || !resendFrom) return { sent: false }
  // The SDK answers a refusal (an unverified domain, a bad key) as `error`, it does not throw.
  const { error } = await new Resend(resendApiKey).emails.send({ from: resendFrom, ...mail })
  if (error) {
    log.error({ err: error, subject: mail.subject }, 'mail: refused by the provider')
    return { sent: false }
  }
  return { sent: true }
}
