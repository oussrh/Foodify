// server/pos/control.ts
// The owner's switches on a set-up connection: activate once the dishes are matched, pause and
// resume the sending, retry what failed, and disconnect. The caller has guarded the restaurant.
import prisma from '@/lib/prisma'
import { moveTo, POS_STATUS_LABEL, type PosMove } from '@/lib/pos/status'
import { deliverDue, type DeliverySummary } from '@/server/pos/deliver'
import { discardWaiting, readConnection } from '@/server/pos/connection'
import type { PosOutcome } from '@/server/pos/setup'

/**
 * Activates, pauses or resumes the connection (lib/pos/status.ts says from where). Activating needs
 * a location; dishes left unmatched are sent as open items (lib/pos/contract.ts). While paused,
 * events are still queued; resuming sends them, or with `waiting` 'discard' marks them DISCARDED
 * first (kept for the record, never sent).
 */
export async function movePos(restaurantId: string, move: PosMove, waiting: 'send' | 'discard' = 'send'): Promise<PosOutcome<{ status: string; discarded: number }>> {
  const connection = await readConnection(restaurantId)
  if (!connection) return { ok: false, error: 'Connect a POS first' }
  const next = moveTo(connection.status, move)
  if (!next) return { ok: false, error: `Not while the connection is “${POS_STATUS_LABEL[connection.status]}”` }
  if (move === 'activate' && !connection.externalLocationId) return { ok: false, error: 'Choose a location first' }
  const discarded = await prisma.$transaction(async (tx) => {
    const count = move === 'resume' && waiting === 'discard' ? await discardWaiting(tx, { connectionId: connection.id }) : 0
    await tx.posConnection.update({ where: { id: connection.id }, data: { status: next }, select: { id: true } })
    return count
  })
  return { ok: true, status: next, discarded }
}

/**
 * Disconnects the POS: the credentials, the account, the location, the matches and the queued
 * events are removed, and the connection reads as not connected. The events received from the POS
 * are kept, so one replayed after a reconnect is still recognised; every order keeps its POS id.
 */
export async function disconnectPos(restaurantId: string): Promise<PosOutcome> {
  const connection = await readConnection(restaurantId)
  if (!connection) return { ok: false, error: 'No POS is connected' }
  await prisma.$transaction(async (tx) => {
    await tx.posItemMap.deleteMany({ where: { connectionId: connection.id } })
    await tx.posOutbox.deleteMany({ where: { connectionId: connection.id } })
    await tx.posConnection.update({
      where: { id: connection.id },
      data: { status: 'NOT_CONNECTED', credentials: null, credentialsKeyId: null, externalAccountId: null, externalLocationId: null, externalLocationName: null, tokenExpiresAt: null, lastError: null },
      select: { id: true },
    })
  })
  return { ok: true }
}

/**
 * Puts every failed row back in the queue with its retries restored, brings forward the ones
 * waiting out a retry, and sweeps now. Answers how many were put back and what the sweep did.
 */
export async function retryPosNow(restaurantId: string, now: Date = new Date()): Promise<PosOutcome<DeliverySummary & { requeued: number }>> {
  const connection = await readConnection(restaurantId)
  if (!connection) return { ok: false, error: 'Connect a POS first' }
  const failed = await prisma.posOutbox.updateMany({ where: { connectionId: connection.id, status: 'FAILED' }, data: { status: 'PENDING', attempts: 0, nextAttemptAt: now } })
  await prisma.posOutbox.updateMany({ where: { connectionId: connection.id, status: 'PENDING', nextAttemptAt: { gt: now } }, data: { nextAttemptAt: now } })
  const summary = await deliverDue({ restaurantId, now })
  return { ok: true, requeued: failed.count, ...summary }
}
