// lib/pos/test-adapter.ts
// The Test POS: a point of sale that takes everything and says what it took, so a connection can
// be made, matched, activated and watched end to end without a vendor account. Its ids are
// derived from ours, so the same ticket always gets the same id. How it behaves is written in the
// API key, the way a payment sandbox reads its test card numbers: a key must start `test_`;
// `test_refuse…` refuses every ticket, change and close; `test_retry…` asks for a retry every
// time, and `test_retryN…` for the first N attempts only; `test_bad…` is refused at sign-in. Its
// webhooks carry a timestamp (`x-test-pos-timestamp`, seconds) and are signed with the key itself
// over `<timestamp>.<body>` (HMAC-SHA256, hex, in `x-test-pos-signature`); one older than five
// minutes is refused however well it is signed.
import { createHmac, timingSafeEqual } from 'node:crypto'
import { testPosEvent } from '@/lib/schemas/pos'
import { freshTimestamp, type PosAdapter, type PosAdapterContext, type PosBillRef, type PosChange, type PosMenuItem, type PosResult, type PosTicket, type PosWebhookRequest } from './contract'

/** The registry key of the Test POS. */
export const TEST_POS = 'test-pos'

/** The header its webhooks carry their signature in. */
export const TEST_POS_SIGNATURE = 'x-test-pos-signature'
/** The header its webhooks carry the signed moment in, in seconds since the epoch. */
export const TEST_POS_TIMESTAMP = 'x-test-pos-timestamp'

/** The two places the Test POS says the account sells from. */
export const TEST_POS_LOCATIONS = [
  { id: 'tpos-dining-room', name: 'Dining room' },
  { id: 'tpos-terrace', name: 'Terrace' },
] as const

/** Its menu: a few dishes a restaurant here is likely to have, so matching by name has something to find. */
export const TEST_POS_MENU: readonly PosMenuItem[] = [
  { id: 'tpos-item-harira', name: 'Harira', price: '4.50' },
  { id: 'tpos-item-moroccan-salad', name: 'Moroccan Salad', price: '4.50' },
  { id: 'tpos-item-lamb-tagine', name: 'Lamb Tagine with Prunes', price: '16.50' },
  { id: 'tpos-item-chicken-couscous', name: 'Chicken Couscous', price: '14.00' },
  { id: 'tpos-item-grilled-chicken', name: 'Grilled Chicken', price: '12.99' },
  { id: 'tpos-item-mint-tea', name: 'Mint Tea', price: '3.00' },
  { id: 'tpos-item-espresso', name: 'Espresso', price: '2.50' },
]

/** The signature the Test POS puts on a webhook `body` sent at `timestamp` for the connection whose key is `apiKey`. */
export function testPosSignature(apiKey: string, timestamp: string, body: string): string {
  return createHmac('sha256', apiKey).update(`${timestamp}.${body}`).digest('hex')
}

/** Whether `signature` is the one `apiKey` makes for `body` at `timestamp`, compared in constant time. */
function signedBy(apiKey: string, timestamp: string, body: string, signature: string | undefined): boolean {
  const expected = Buffer.from(testPosSignature(apiKey, timestamp, body))
  const given = Buffer.from(signature ?? '')
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/** How many first attempts `test_retryN…` asks to fail: N, every one for a bare `test_retry`, none otherwise. */
function retriesAsked(apiKey: string): number {
  const match = /^test_retry(\d*)/.exec(apiKey)
  if (!match) return 0
  return match[1] ? Number(match[1]) : Number.POSITIVE_INFINITY
}

/** What any write answers under this key and attempt, when the key asks for trouble; null when it goes through. */
function trouble(apiKey: string, attempt: number): PosResult | null {
  if (apiKey.startsWith('test_refuse')) return { kind: 'refused', reason: 'The Test POS refused it (the key asks for refusals)' }
  if (attempt <= retriesAsked(apiKey)) return { kind: 'retry', reason: 'The Test POS asked to try again later' }
  return null
}

/** The note a taken ticket leaves on its outbox row: what arrived, and which lines were not matched. */
function ticketNote(bill: PosBillRef, ticket: PosTicket): string {
  const open = ticket.lines.filter((line) => line.externalItemId === null).length
  const part = ticket.id === bill.id ? 'opening its bill' : `on bill #${bill.number}`
  const unmapped = open > 0 ? `, ${open} unmatched kept as open items` : ''
  return `Received ticket #${ticket.number} for table ${ticket.table} (${part}): ${ticket.lines.length} lines${unmapped}`
}

/** The Test POS for one connection. */
export function createTestAdapter(context: PosAdapterContext): PosAdapter {
  const apiKey = context.credentials.apiKey ?? ''
  const write = async (externalId: string, note: string): Promise<PosResult> => trouble(apiKey, context.attempt) ?? { kind: 'ok', externalId, note }
  return {
    describe: () => ({ key: TEST_POS, name: 'Test POS', auth: 'api_key', closesBills: true, webhooks: true }),
    connect: async (credentials) => {
      const key = credentials.apiKey ?? ''
      if (!key.startsWith('test_') || key.startsWith('test_bad')) return { kind: 'refused', reason: 'The Test POS takes a key that starts with test_' }
      return { kind: 'ok', accountId: `tpos-account-${createHmac('sha256', 'account').update(key).digest('hex').slice(0, 8)}`, locations: [...TEST_POS_LOCATIONS] }
    },
    test: async () => ({ kind: 'ok', note: 'The Test POS answered' }),
    readMenu: async () => ({ kind: 'ok', items: [...TEST_POS_MENU] }),
    sendTicket: (bill, ticket) => write(`tpos-ticket-${ticket.id}`, ticketNote(bill, ticket)),
    changeTicket: (change: PosChange) => write(`tpos-change-${change.idempotencyKey}`, `Received a ${change.kind.toLowerCase()} on ${change.ticketExternalId ?? 'a ticket it never had'}`),
    closeBill: (bill) => write(`tpos-close-${bill.billId}`, `Closed ${bill.externalId ?? 'a bill it never had'} at ${bill.total}`),
    parseWebhook: async (request: PosWebhookRequest) => {
      const timestamp = request.headers[TEST_POS_TIMESTAMP] ?? ''
      if (!signedBy(apiKey, timestamp, request.body, request.headers[TEST_POS_SIGNATURE])) return { kind: 'refused', reason: 'The signature does not match' }
      if (!freshTimestamp(timestamp, request.receivedAt)) return { kind: 'refused', reason: 'The event is too old, or from the future' }
      let body: unknown
      try {
        body = JSON.parse(request.body)
      } catch {
        return { kind: 'refused', reason: 'The body is not JSON' }
      }
      const event = testPosEvent.safeParse(body)
      if (!event.success) return { kind: 'refused', reason: 'The event is not one the Test POS sends' }
      const { id, type, location, bill, item } = event.data
      return { kind: 'ok', event: { id, kind: type, locationId: location, billExternalId: bill ?? null, itemExternalId: item ?? null } }
    },
  }
}
