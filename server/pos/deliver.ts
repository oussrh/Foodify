// server/pos/deliver.ts
// Sending what the outbox owes the POS. A sweep claims due rows (server/pos/claim.ts: a bill's and
// a ticket's rows go in order, only an ACTIVE connection is claimed), sends each through its
// connection's adapter with the row's id as the idempotency key and a 20-second limit, and records
// the answer (lib/pos/outbox-rules.ts): taken is SENT with the POS's id (a ticket's is also stamped
// on the order, with the POS check it went on), no is REFUSED, and "later" backs off 1, 5, 15, 60
// minutes before FAILED. An answer is recorded only while this claim still holds the row. Delivery
// is at least once: a send cut off by the limit, or by a lost lease, is sent again under the same
// key. One row that fails in any way is logged and counted, and the sweep goes on with the next.
import type { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { answerOf, type PosResult } from '@/lib/pos/contract'
import { nextStep, type OutboxStatus, type OutboxStep } from '@/lib/pos/outbox-rules'
import { log } from '@/server/log'
import { claimDue } from '@/server/pos/claim'
import { CONNECTION_SELECT, openAdapter } from '@/server/pos/connection'
import { callFor, type PosCall } from '@/server/pos/payloads'

/** How many rows one claim takes, and how many claims one sweep makes at most. */
const BATCH = 10
const MAX_ROUNDS = 5

/** What a sweep did: rows sent, left to try again, given up on, refused, and rows that broke (logged). */
export type DeliverySummary = { sent: number; retried: number; failed: number; refused: number; errors: number }

const ROW = { id: true, kind: true, attempts: true, orderId: true, changeId: true, connectionId: true, claimToken: true, connection: { select: CONNECTION_SELECT } } satisfies Prisma.PosOutboxSelect
type Row = Prisma.PosOutboxGetPayload<{ select: typeof ROW }>

const deliverLog = log.child({ module: 'pos-deliver' })

/** Sends one claimed row and answers what the POS said, with the call it made; a row whose adapter cannot be made is a retry. */
async function send(row: Row): Promise<{ result: PosResult; call: PosCall | null }> {
  const opened = openAdapter(row.connection, row.attempts)
  if ('error' in opened) return { result: { kind: 'retry', reason: opened.error }, call: null }
  const call = await callFor(row)
  return { result: await answerOf(() => call.send(opened.adapter)), call }
}

/**
 * Writes `step` on the row, its connection and, for a ticket taken, the order, but only while the
 * row is still held by claim `token`; answers whether it was. A worker whose lease ran out, and
 * whose row another claim has taken, writes nothing.
 */
async function record(row: Row, token: string, { step, check }: { step: OutboxStep; check: string | null }, now: Date): Promise<boolean> {
  const sent = step.status === 'SENT'
  return prisma.$transaction(async (tx) => {
    const held = await tx.posOutbox.updateMany({
      where: { id: row.id, claimToken: token },
      data: { status: step.status, lastAnswer: step.lastAnswer, externalId: step.externalId, sentAt: step.sentAt, claimToken: null, ...(step.nextAttemptAt ? { nextAttemptAt: step.nextAttemptAt } : {}) },
    })
    if (held.count === 0) return false
    await tx.posConnection.update({ where: { id: row.connectionId }, data: sent ? { lastSyncAt: now, lastError: null } : { lastError: step.lastAnswer }, select: { id: true } })
    if (sent && row.kind === 'TICKET' && step.externalId) {
      await tx.order.update({ where: { id: row.orderId }, data: { externalId: step.externalId, posCheckId: check ?? step.externalId }, select: { id: true } })
    }
    return true
  })
}

/**
 * Sends one row held by claim `token` and records the answer. Answers the row's new state, or null
 * when there is nothing to record: the row went away (a disconnect) or another claim holds it now.
 */
export async function deliverClaimed(id: string, token: string, now: Date): Promise<OutboxStatus | null> {
  const row = await prisma.posOutbox.findUnique({ where: { id }, select: ROW })
  if (!row || row.claimToken !== token) return null
  const { result, call } = await send(row)
  const step = nextStep(result, row.attempts, now)
  return (await record(row, token, { step, check: call?.check ?? null }, now)) ? step.status : null
}

const TALLY: Record<OutboxStatus, keyof DeliverySummary | null> = { SENT: 'sent', PENDING: 'retried', FAILED: 'failed', REFUSED: 'refused', DISCARDED: null }

/** Delivers one row, counting it; a row that throws is logged by id and counted as an error, and the sweep goes on. */
async function deliverCounted(id: string, token: string, now: Date, summary: DeliverySummary): Promise<void> {
  try {
    const status = await deliverClaimed(id, token, now)
    const key = status ? TALLY[status] : null
    if (key) summary[key] += 1
  } catch (error) {
    summary.errors += 1
    deliverLog.error({ err: error, outboxId: id }, 'pos: a row could not be delivered')
  }
}

/**
 * Sends the due rows of one restaurant (`restaurantId`), or of every restaurant (the cron), as of
 * `now`. Bounded: at most MAX_ROUNDS claims of BATCH rows, so a backlog is worked through over
 * several sweeps rather than holding one request open. Never throws: a claim that fails is logged
 * and ends the sweep with what it did so far.
 */
export async function deliverDue(options: { restaurantId?: string; now?: Date } = {}): Promise<DeliverySummary> {
  const summary: DeliverySummary = { sent: 0, retried: 0, failed: 0, refused: 0, errors: 0 }
  const now = options.now ?? new Date()
  for (let round = 0; round < MAX_ROUNDS; round++) {
    let claim
    try {
      claim = await claimDue(prisma, { restaurantId: options.restaurantId, now, limit: BATCH })
    } catch (error) {
      summary.errors += 1
      deliverLog.error({ err: error, restaurantId: options.restaurantId }, 'pos: the claim failed')
      break
    }
    if (claim.ids.length === 0) break
    for (const id of claim.ids) await deliverCounted(id, claim.token, now, summary)
  }
  return summary
}
