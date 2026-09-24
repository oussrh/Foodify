// server/pos/enqueue.ts
// Writing what the POS is owed, in the same transaction as the event itself: a ticket stored, a
// change applied, a bill closed. Either both are written or neither, so the POS can never hear of
// a ticket that was rolled back nor miss one that was kept. A restaurant is written for once its
// connection has been activated and while POS is on for it: ACTIVE, and also PAUSED or ERROR,
// whose events wait (delivery sends only while ACTIVE; on Resume the owner sends or discards
// them). For every other restaurant this is one indexed read and nothing more. The rows are sent
// once the response has gone (server/pos/trigger.ts).
import type { Prisma, PosOutboxKind, PosStatus } from '@/generated/prisma/client'
import { kickDelivery } from '@/server/pos/trigger'

/** One event for the POS: the ticket (or the bill, for a close), the bill it belongs to, and the change when there is one. */
export type PosEvent = { restaurantId: string; orderId: string; billId: string; kind: PosOutboxKind; changeId?: string | null }

/** The states of a connection that has been activated: events are queued in each, and sent only while ACTIVE. */
const QUEUEING: PosStatus[] = ['ACTIVE', 'PAUSED', 'ERROR']

/**
 * Queues `event` inside `tx` when the restaurant's POS is on and its connection has been activated,
 * and asks for a sweep after the response when it is active. Answers whether it queued anything.
 */
export async function enqueuePos(tx: Prisma.TransactionClient, event: PosEvent): Promise<boolean> {
  const connection = await tx.posConnection.findFirst({
    where: { restaurantId: event.restaurantId, status: { in: QUEUEING }, restaurant: { posEnabled: true } },
    select: { id: true, status: true },
  })
  if (!connection) return false
  await tx.posOutbox.create({
    data: { connectionId: connection.id, restaurantId: event.restaurantId, orderId: event.orderId, billId: event.billId, kind: event.kind, changeId: event.changeId ?? null },
    select: { id: true },
  })
  if (connection.status === 'ACTIVE') kickDelivery(event.restaurantId)
  return true
}
