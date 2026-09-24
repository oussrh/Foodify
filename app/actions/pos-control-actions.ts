// app/actions/pos-control-actions.ts
// The health panel's switches: pause and resume the sending, retry what failed, disconnect. The
// restaurant's owner or a super admin acting for them (logged as such), POS on (`requirePosAccess`).
'use server'

import { requirePosAccess } from '@/lib/auth-guard'
import { uuid } from '@/lib/schemas/common'
import { posResumeInput, type PosResumeInput } from '@/lib/schemas/pos'
import { audited } from '@/server/pos/audit'
import { disconnectPos as disconnect, movePos, retryPosNow as retryNow } from '@/server/pos/control'

/** The restaurant's owner or a super admin, POS on. Stops sending; events go on being queued while paused, and wait for Resume. */
export async function pausePos(rawRestaurantId: string) {
  const restaurantId = uuid.parse(rawRestaurantId)
  const actor = await requirePosAccess(restaurantId)
  return audited(actor, restaurantId, 'pause', await movePos(restaurantId, 'pause'))
}

/**
 * The same people. Parses `posResumeInput` and starts sending again: with `waiting` 'send' the
 * events queued during the pause go first, with 'discard' they are marked DISCARDED and never sent.
 */
export async function resumePos(rawRestaurantId: string, raw: PosResumeInput) {
  const restaurantId = uuid.parse(rawRestaurantId)
  const actor = await requirePosAccess(restaurantId)
  const { waiting } = posResumeInput.parse(raw)
  return audited(actor, restaurantId, `resume-${waiting}`, await movePos(restaurantId, 'resume', waiting))
}

/** The same people. Removes the credentials, the matches and the queue; every order keeps the POS id it was given. */
export async function disconnectPos(rawRestaurantId: string) {
  const restaurantId = uuid.parse(rawRestaurantId)
  const actor = await requirePosAccess(restaurantId)
  return audited(actor, restaurantId, 'disconnect', await disconnect(restaurantId))
}

/** The same people. Puts failed rows back in the queue and sends what is due now. Answers what was put back and what the sweep did. */
export async function retryPosNow(rawRestaurantId: string) {
  const restaurantId = uuid.parse(rawRestaurantId)
  const actor = await requirePosAccess(restaurantId)
  return audited(actor, restaurantId, 'retry', await retryNow(restaurantId))
}
