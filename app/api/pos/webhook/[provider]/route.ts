// app/api/pos/webhook/[provider]/route.ts
// Where a POS tells us things: a check paid at its till, an item it ran out of, its menu changed.
// Registered with the POS as `/api/pos/webhook/<provider>?connection=<id>`; the connection's own
// adapter verifies the signature and its timestamp (server/pos/webhook.ts), and nothing is read
// from the body before it has. No session: the signature is the credential. The body is bounded
// before it is read: a declared length over 64 KB is refused unread, and reading stops at 64 KB.
import { fail, ok } from '@/lib/api'
import { posWebhookTarget } from '@/lib/schemas/pos'
import { log } from '@/server/log'
import { receiveWebhook, type WebhookOutcome } from '@/server/pos/webhook'

/** The largest body read: a webhook is an event, not a menu. */
const MAX_BODY = 64 * 1024

/** The body as text, or null past MAX_BODY: read chunk by chunk, so an oversized body is never held whole. */
async function boundedBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get('content-length') ?? '0')
  if (declared > MAX_BODY) return null
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
    size += chunk.value.byteLength
    if (size > MAX_BODY) {
      await reader.cancel()
      return null
    }
    chunks.push(chunk.value)
  }
  return new TextDecoder().decode(Buffer.concat(chunks))
}

/** The answer for each outcome: 2xx for what is done (a POS stops retrying); before verification, one generic 404. */
function answer(outcome: WebhookOutcome): Response {
  switch (outcome.status) {
    case 'unknown':
      return fail('not_found', 'Unknown webhook', 404)
    case 'unauthorized':
      return fail('unauthenticated', 'The signature does not verify', 401)
    case 'inactive':
      return fail('unavailable', 'The connection is not active; send it again later', 409)
    case 'foreign_location':
      return fail('forbidden', 'This event is for another location', 403)
    case 'duplicate':
      return ok({ duplicate: true })
    default:
      return ok({ duplicate: false, result: outcome.status, kind: outcome.kind })
  }
}

/**
 * POST, a POS only: the path's provider and `?connection=` (uuid) name the connection, else 400
 * invalid_query; a body over 64 KB is 413 invalid_payload. Before the event is verified, an unknown
 * connection, one of another provider or credentials that cannot be opened all
 * answer the same 404 "Unknown webhook"; a signature that does not verify (or a
 * timestamp older than five minutes) is 401. A verified event answers 200 `{ data: { duplicate,
 * result?, kind? } }` (applied, recorded for the owner, ignored, or already received), 403
 * forbidden for another location's event, 409 unavailable while the connection is not active (the
 * POS retries later); 500 internal.
 */
export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }): Promise<Response> {
  const target = posWebhookTarget.safeParse({ provider: (await params).provider, connection: new URL(request.url).searchParams.get('connection') })
  if (!target.success) return fail('invalid_query', 'The address names a provider and a connection', 400)
  const body = await boundedBody(request)
  if (body === null) return fail('invalid_payload', 'The event is too large', 413)
  try {
    const headers = Object.fromEntries([...request.headers.entries()].map(([name, value]) => [name.toLowerCase(), value]))
    return answer(await receiveWebhook({ provider: target.data.provider, connectionId: target.data.connection, request: { headers, body, receivedAt: new Date() } }))
  } catch (error) {
    log.error({ err: error, provider: target.data.provider }, 'pos: webhook not applied')
    return fail('internal', 'The event was not applied', 500)
  }
}
