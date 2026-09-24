// server/pos/webhook.ts
// What a POS tells us. The event is verified by the connection's own adapter (the signature and
// its timestamp are the adapter's business: the Test POS checks an HMAC with its key over a
// timestamp no older than five minutes), refused when it is for another location, and kept by its
// id in the inbox so a second delivery is ignored, across a disconnect too; only its hash is kept.
// Until an event is verified, nothing about the connection is told: every failure before that is
// the same "unknown". Then it is applied through the paths the staff use. A check paid or closed at
// the till marks the tickets rung up on it paid, and closes the bill (server/bill-changes.ts, as the
// POS: no person, `source` POS, not sent back to it) once every ticket of it that reached the POS
// is paid, which after a merge can take more than one check; the waiters whose requests the close
// answered are told, as when staff close. An item the POS ran out of sells the dishes matched to it
// out until the next service (lib/availability.ts), and a changed POS menu is recorded for the owner
// to review, never applied silently, since only the owner can say which dish an item now is.
import { createHash } from 'node:crypto'
import { Prisma } from '@/generated/prisma/client'
import { soldOutUntilNextService } from '@/lib/availability'
import prisma from '@/lib/prisma'
import { answerOf, type PosInboundEvent, type PosWebhookRequest } from '@/lib/pos/contract'
import { afterResponse } from '@/server/after-response'
import { closeBill } from '@/server/bill-changes'
import { pushChangeAnswers } from '@/server/change-push'
import { log } from '@/server/log'
import { CONNECTION_SELECT, openAdapter, type ConnectionRow } from '@/server/pos/connection'

/** What became of a webhook: each maps to one answer of the route. */
export type WebhookOutcome =
  | { status: 'unknown' }
  | { status: 'unauthorized' }
  | { status: 'inactive' }
  | { status: 'foreign_location' }
  | { status: 'duplicate' }
  | { status: 'applied' | 'recorded' | 'ignored'; kind: PosInboundEvent['kind'] }

/** Where a webhook was addressed and what it carried. */
export type WebhookInput = { provider: string; connectionId: string; request: PosWebhookRequest }

type Connection = ConnectionRow & { restaurant: { timeZone: string } }

const webhookLog = log.child({ module: 'pos-webhook' })

/** The most tickets one check covers, and one bill holds, that a payment reads. */
const MAX_TICKETS = 200

/** Closes `billId` as the POS once every ticket of it that reached the POS is paid; answers whether it closed. */
async function closeIfPaid(billId: string): Promise<boolean> {
  const tickets = await prisma.order.findMany({ where: { OR: [{ id: billId }, { parentId: billId }] }, select: { posCheckId: true, posPaidAt: true }, take: MAX_TICKETS })
  // A ticket never sent, or refused, has no check and holds nothing up.
  if (tickets.some((ticket) => ticket.posCheckId !== null && ticket.posPaidAt === null)) return false
  const closed = await closeBill(billId, true, null)
  if (!closed.ok) return false
  if (closed.answered.length > 0) afterResponse(() => pushChangeAnswers(closed.answered))
  return true
}

/** Marks the tickets rung up on the check the POS says was paid, and closes each bill they are on that is now paid in full. */
async function paidFromPos(connection: Connection, event: PosInboundEvent): Promise<'applied' | 'ignored'> {
  if (!event.billExternalId) return 'ignored'
  const check = { restaurantId: connection.restaurantId, posCheckId: event.billExternalId }
  await prisma.order.updateMany({ where: { ...check, posPaidAt: null }, data: { posPaidAt: new Date() } })
  const tickets = await prisma.order.findMany({ where: check, select: { id: true, parentId: true }, take: MAX_TICKETS })
  if (tickets.length === 0) return 'ignored'
  // The bill each ticket is on now: after a merge, not the one it was rung up with.
  for (const billId of new Set(tickets.map((ticket) => ticket.parentId ?? ticket.id))) await closeIfPaid(billId)
  return 'applied'
}

/** Sells out, until the restaurant's next service, every dish matched to the item the POS ran out of. */
async function soldOutFromPos(connection: Connection, event: PosInboundEvent): Promise<'applied' | 'ignored'> {
  if (!event.itemExternalId) return 'ignored'
  const maps = await prisma.posItemMap.findMany({ where: { connectionId: connection.id, externalItemId: event.itemExternalId }, select: { dishId: true }, take: 50 })
  if (maps.length === 0) return 'ignored'
  const until = soldOutUntilNextService(new Date(), connection.restaurant.timeZone)
  await prisma.dish.updateMany({ where: { id: { in: maps.map((map) => map.dishId) }, restaurantId: connection.restaurantId }, data: { soldOutUntil: until } })
  return 'applied'
}

/** Applies a verified, new event; a menu change is only recorded. */
function apply(connection: Connection, event: PosInboundEvent): Promise<'applied' | 'recorded' | 'ignored'> {
  if (event.kind === 'PAID' || event.kind === 'CLOSED') return paidFromPos(connection, event)
  if (event.kind === 'ITEM_UNAVAILABLE') return soldOutFromPos(connection, event)
  return Promise.resolve('recorded')
}

/** Keeps the event in the inbox by its id; null when that id was received before. */
async function remember(connectionId: string, event: PosInboundEvent, body: string): Promise<{ id: string } | null> {
  const key = { connectionId_externalEventId: { connectionId, externalEventId: event.id } }
  if (await prisma.posInbox.findUnique({ where: key, select: { id: true } })) return null
  try {
    const payloadHash = createHash('sha256').update(body).digest('hex')
    return await prisma.posInbox.create({ data: { connectionId, externalEventId: event.id, kind: event.kind, payloadHash }, select: { id: true } })
  } catch (error) {
    // Two deliveries of one event at once: the unique index lets one in.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return null
    throw error
  }
}

/** The connection a webhook names, with the restaurant's clock; null when there is none for this provider or POS is off there. */
async function connectionFor(input: WebhookInput): Promise<Connection | null> {
  const row = await prisma.posConnection.findFirst({
    where: { id: input.connectionId, provider: input.provider, restaurant: { posEnabled: true } },
    select: { ...CONNECTION_SELECT, restaurant: { select: { timeZone: true } } },
  })
  return row
}

/**
 * Verifies, deduplicates and applies one webhook. Nothing is read from the body before its
 * adapter has verified it, and before that every failure (no such connection, POS off, credentials
 * that cannot be opened, an adapter that cannot verify) is the same `unknown`; a bad signature is
 * `unauthorized`, with no reason. The connection's state is told only to a verified sender.
 */
export async function receiveWebhook(input: WebhookInput): Promise<WebhookOutcome> {
  const connection = await connectionFor(input)
  if (!connection) return { status: 'unknown' }
  const opened = openAdapter(connection)
  if ('error' in opened) return { status: 'unknown' }
  const { parseWebhook } = opened.adapter
  if (!parseWebhook) return { status: 'unknown' }
  const parsed = await answerOf(() => parseWebhook(input.request))
  if (parsed.kind === 'refused') return { status: 'unauthorized' }
  if (parsed.kind === 'retry') return { status: 'unknown' }
  const { event } = parsed
  if (connection.status !== 'ACTIVE') return { status: 'inactive' }
  if (event.locationId !== connection.externalLocationId) return { status: 'foreign_location' }

  const kept = await remember(connection.id, event, input.request.body)
  if (!kept) return { status: 'duplicate' }
  let result: 'applied' | 'recorded' | 'ignored'
  try {
    result = await apply(connection, event)
  } catch (error) {
    // Forgotten again, so the POS's retry of this event is applied rather than ignored.
    await prisma.posInbox.delete({ where: { id: kept.id }, select: { id: true } })
    throw error
  }
  if (result !== 'recorded') await prisma.posInbox.update({ where: { id: kept.id }, data: { appliedAt: new Date() }, select: { id: true } })
  webhookLog.info({ restaurantId: connection.restaurantId, eventKind: event.kind, result }, 'pos: webhook received')
  return { status: result, kind: event.kind }
}
