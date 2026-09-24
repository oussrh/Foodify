// lib/pos/outbox-rules.ts
// What the outbox does with an adapter's answer, and when a row may go at all. An answer settles a
// row: taken is SENT, no is REFUSED (asking again would get the same no), and "later" waits 1, 5,
// 15, then 60 minutes before the row is given up as FAILED, where only the owner's "Retry now"
// picks it up again. The order rows are sent in is a rule of the claim query (server/pos/claim.ts):
// a row waits for every earlier row of its bill or of its ticket that is pending or has failed.
import type { PosResult } from './contract'

/** The minutes a row waits after each "try again later", in order; one more is FAILED. */
export const BACKOFF_MINUTES = [1, 5, 15, 60] as const

/** How long a claimed row is held by the worker that claimed it: another may pick it up after this if that worker died mid-send. */
export const LEASE_MINUTES = 2

/** The outbox states, as the table stores them. */
export type OutboxStatus = 'PENDING' | 'SENT' | 'FAILED' | 'REFUSED' | 'DISCARDED'

/** The states that hold up every later row of the same bill or ticket: sent, refused and discarded rows do not. */
export const BLOCKING_STATUSES = ['PENDING', 'FAILED'] as const satisfies readonly OutboxStatus[]

/** Where a row stands once an answer is recorded. `nextAttemptAt` is set only while it is still pending. */
export interface OutboxStep {
  status: OutboxStatus
  nextAttemptAt: Date | null
  lastAnswer: string
  externalId: string | null
  sentAt: Date | null
}

const MINUTE = 60_000

/** The answer in the words the health panel shows; the POS's own note when it gave one. */
export function answerText(result: PosResult): string {
  if (result.kind === 'ok') return result.note ?? 'Taken by the POS'
  return result.reason
}

/**
 * What a row becomes after its `attempts`-th send (1 for the first) answered `result`, at `now`:
 * SENT with the POS's id, REFUSED, PENDING until the next wait is over, or FAILED once the waits
 * of BACKOFF_MINUTES are spent.
 */
export function nextStep(result: PosResult, attempts: number, now: Date): OutboxStep {
  const lastAnswer = answerText(result)
  if (result.kind === 'ok') return { status: 'SENT', nextAttemptAt: null, lastAnswer, externalId: result.externalId ?? null, sentAt: now }
  if (result.kind === 'refused') return { status: 'REFUSED', nextAttemptAt: null, lastAnswer, externalId: null, sentAt: null }
  const wait = BACKOFF_MINUTES[attempts - 1]
  if (wait === undefined) return { status: 'FAILED', nextAttemptAt: null, lastAnswer, externalId: null, sentAt: null }
  return { status: 'PENDING', nextAttemptAt: new Date(now.getTime() + wait * MINUTE), lastAnswer, externalId: null, sentAt: null }
}

/** The moment a claim holds a row until. */
export function leaseUntil(now: Date): Date {
  return new Date(now.getTime() + LEASE_MINUTES * MINUTE)
}
