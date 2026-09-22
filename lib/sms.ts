// lib/sms.ts
// The one place that talks to Brevo's transactional SMS. Without the key and sender pair
// (BREVO_API_KEY, BREVO_SMS_SENDER — the account is not linked yet) nothing is sent and the
// caller is told, the way lib/mail.ts reports a missing Resend key: an order is taken whether or
// not a confirmation can go out. Brevo's REST endpoint is called directly; there is no SDK to
// install, and the number is never logged (server/log.ts redacts `phone` and `recipient`).
import { serverEnv } from '@/lib/env'
import { log } from '@/server/log'

const ENDPOINT = 'https://api.brevo.com/v3/transactionalSMS/sms'

/** One text message as a caller composes it; the sender is the env's, not the caller's. */
export type Sms = { to: string; text: string }

/**
 * Sends, or reports that it could not: `{ sent: false }` when the account is not linked, when
 * Brevo refuses (an unverified sender, a bad key, an unroutable country) or when the request
 * fails. The caller decides what that means; an order is never refused over a message.
 */
export async function sendSms({ to, text }: Sms): Promise<{ sent: boolean }> {
  const brevo = serverEnv.brevoSms
  if (!brevo) return { sent: false }
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'api-key': brevo.apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sender: brevo.sender, recipient: to, content: text, type: 'transactional' }),
    })
    if (!response.ok) {
      // The body carries Brevo's own code and message; it names the sender or the plan, not the number.
      const detail = await response.text().catch(() => '')
      log.error({ status: response.status, detail: detail.slice(0, 200) }, 'sms: refused by the provider')
      return { sent: false }
    }
    return { sent: true }
  } catch (error) {
    log.error({ err: error }, 'sms: request failed')
    return { sent: false }
  }
}
