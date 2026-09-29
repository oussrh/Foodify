// server/pos/audit.ts
// Every POS action leaves a line in the server log: who (by id and role, never an address), on
// which restaurant, what, and how it ended. A super admin acting on an owner's behalf is marked so,
// which is how "the super admin did it" is answered later. Credentials never reach this module.
import { log } from '@/server/log'

const posLog = log.child({ module: 'pos' })

/** Who acted, as the guard answered it. */
export type PosActor = { id: string; role: string }

/** Logs one POS action on `restaurantId` by `actor` and how it ended (`outcome`: a word such as ok or refused). */
export function auditPos(actor: PosActor, restaurantId: string, action: string, outcome: string): void {
  posLog.info({ actorId: actor.id, role: actor.role, onBehalf: actor.role === 'SUPER_ADMIN', restaurantId, action, outcome }, `pos: ${action} ${outcome}`)
}

/** Logs a POS action by its outcome (`ok`, or `refused` with the reason kept out of the log) and hands the outcome back. */
export function audited<T extends { ok: boolean }>(actor: PosActor, restaurantId: string, action: string, outcome: T): T {
  auditPos(actor, restaurantId, action, outcome.ok ? 'ok' : 'refused')
  return outcome
}
