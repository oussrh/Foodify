// lib/pos/contract.ts
// The one contract every point of sale is reached through. An adapter is made for one connection
// (its credentials, its location, the attempt being made) and speaks for that POS: it signs in,
// lists locations and items, takes tickets, changes and closes, and reads the POS's webhooks.
// Every call answers one of three things and nothing else: done (with the POS's id for what it
// took), try again later, or no. So the outbox (server/pos/deliver.ts) never has to know which
// vendor it is talking to. Money crosses as exact decimal strings, never floats (lib/money.ts).

/** What an adapter call came to: taken (with the POS's id for it), worth asking again later, or refused for good. */
export type PosResult = { kind: 'ok'; externalId?: string; note?: string } | { kind: 'retry'; reason: string } | { kind: 'refused'; reason: string }

/** A call that answers data when it succeeds; the same retry and refusal otherwise. */
export type PosAnswer<T> = ({ kind: 'ok' } & T) | { kind: 'retry'; reason: string } | { kind: 'refused'; reason: string }

/** What the owner gave to sign in (an API key, a token): sealed at rest (server/pos-crypto.ts), never sent to a browser. */
export type PosCredentials = Record<string, string>

/** One place the account sells from; tickets go to the one the owner chose. */
export interface PosLocation {
  id: string
  name: string
}

/** One item of the POS's own menu, its price an exact decimal string. */
export interface PosMenuItem {
  id: string
  name: string
  price: string
}

/** Which bill a ticket belongs to, and the POS's id for it once it has one. */
export interface PosBillRef {
  id: string
  number: number
  table: string
  externalId: string | null
}

/**
 * One line of a ticket as it was ordered. `externalItemId` is null for a dish the owner has not
 * matched to a POS item: the line is still sent, and the adapter decides whether its POS takes an
 * open item or refuses the ticket (an open question of the design, left to each vendor).
 */
export interface PosTicketLine {
  lineId: string
  name: string
  quantity: number
  unitPrice: string
  note: string | null
  externalItemId: string | null
}

/** A ticket for the kitchen, as placed. `idempotencyKey` is the outbox row: a resend carries the same one. */
export interface PosTicket {
  idempotencyKey: string
  id: string
  number: number
  table: string
  note: string | null
  currency: string | null
  subtotal: string
  placedAt: string
  lines: PosTicketLine[]
}

/** A change to a ticket the POS already has: the whole of it cancelled or voided, or `quantity` of one line taken off. */
export interface PosChange {
  idempotencyKey: string
  ticketId: string
  ticketExternalId: string | null
  kind: 'CANCEL' | 'REMOVE' | 'VOID'
  lineId: string | null
  externalItemId: string | null
  quantity: number | null
  reason: string | null
}

/** A bill paid and closed on our side, with what it came to. */
export interface PosBillClose {
  idempotencyKey: string
  billId: string
  externalId: string | null
  total: string
  closedAt: string
}

/**
 * A webhook as it arrived: its headers (lower-case names), its raw body, which the signature
 * covers, and when it was received. An adapter must refuse an event whose signed timestamp is
 * further than WEBHOOK_TOLERANCE_MS from `receivedAt`, so a captured event cannot be replayed later.
 */
export interface PosWebhookRequest {
  headers: Record<string, string>
  body: string
  receivedAt: Date
}

/** How far a webhook's signed timestamp may be from the moment it is received, either way. */
export const WEBHOOK_TOLERANCE_MS = 5 * 60_000

/** Whether a signed timestamp (seconds since the epoch, as text) is within WEBHOOK_TOLERANCE_MS of `receivedAt`. */
export function freshTimestamp(timestamp: string | undefined, receivedAt: Date): boolean {
  if (!timestamp || !/^\d{1,12}$/.test(timestamp)) return false
  return Math.abs(receivedAt.getTime() - Number(timestamp) * 1000) <= WEBHOOK_TOLERANCE_MS
}

/** What a POS can tell us: a bill paid or closed at the till, an item it ran out of, a change to its menu. */
export type PosInboundKind = 'PAID' | 'CLOSED' | 'ITEM_UNAVAILABLE' | 'MENU_CHANGED'

/** One verified event of the POS, by its own id (a second delivery of the same id is ignored). */
export interface PosInboundEvent {
  id: string
  kind: PosInboundKind
  locationId: string
  billExternalId: string | null
  itemExternalId: string | null
}

/** How an owner signs in to the POS: an API key typed in, or a vendor's OAuth screen. */
export type PosAuthKind = 'api_key' | 'oauth'

/** What an adapter says about itself. */
export interface PosDescription {
  key: string
  name: string
  auth: PosAuthKind
  closesBills: boolean
  webhooks: boolean
}

/** One point of sale, spoken to for one connection. `closeBill` and `parseWebhook` are capabilities a POS may not have. */
export interface PosAdapter {
  describe(): PosDescription
  connect(credentials: PosCredentials): Promise<PosAnswer<{ accountId: string; locations: PosLocation[] }>>
  test(): Promise<PosResult>
  readMenu(): Promise<PosAnswer<{ items: PosMenuItem[] }>>
  sendTicket(bill: PosBillRef, ticket: PosTicket): Promise<PosResult>
  changeTicket(change: PosChange): Promise<PosResult>
  closeBill?(bill: PosBillClose): Promise<PosResult>
  parseWebhook?(request: PosWebhookRequest): Promise<PosAnswer<{ event: PosInboundEvent }>>
}

/** What an adapter is made with: the connection's credentials, its chosen location, and which attempt this is (1 for the first). */
export interface PosAdapterContext {
  credentials: PosCredentials
  locationId: string | null
  attempt: number
}

/** Makes the adapter for one connection. */
export type PosAdapterFactory = (context: PosAdapterContext) => PosAdapter

/** What a POS that never answered is taken to have said: ask again later. */
export const NO_ANSWER = 'The POS did not answer'
/** What a POS that answered too late is taken to have said. */
export const TOO_SLOW = 'The POS did not answer in time'

/** How long one adapter call may take: well under the outbox's two-minute lease (lib/pos/outbox-rules.ts). */
export const CALL_TIMEOUT_MS = 20_000

/**
 * Runs one adapter call, for at most `timeoutMs`, and answers what it came to. A call that throws
 * (a network failure, a bug in an adapter) or takes too long is a retry, never a refusal: nothing
 * the POS said can be read from an exception, and a refusal is final. A call cut off by the
 * timeout may still have reached the POS, which is why every send carries an idempotency key.
 */
export async function answerOf<T extends { kind: string }>(call: () => Promise<T>, timeoutMs: number = CALL_TIMEOUT_MS): Promise<T | { kind: 'retry'; reason: string }> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<{ kind: 'retry'; reason: string }>((resolve) => {
    timer = setTimeout(() => resolve({ kind: 'retry', reason: TOO_SLOW }), timeoutMs)
  })
  try {
    return await Promise.race([call(), late])
  } catch {
    return { kind: 'retry', reason: NO_ANSWER }
  } finally {
    clearTimeout(timer)
  }
}
