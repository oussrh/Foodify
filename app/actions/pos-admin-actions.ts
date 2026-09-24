// app/actions/pos-admin-actions.ts
// The super admin's switch: whether a restaurant may connect a POS at all. It stands in for a
// plan until there are plans. Off, every POS action for the restaurant is refused, nothing more is
// queued, and what was waiting is discarded (kept for the record, never sent: it would reach the
// till long after the fact); the connection itself is kept, for when it is switched on again.
'use server'

import prisma from '@/lib/prisma'
import { discardWaiting } from '@/server/pos/connection'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { uuid } from '@/lib/schemas/common'
import { posEnabledInput, type PosEnabledInput } from '@/lib/schemas/pos'
import { auditPos } from '@/server/pos/audit'

/**
 * A super admin only. Parses the restaurant id and `posEnabledInput` and sets `Restaurant.posEnabled`,
 * logged; switching it off discards the rows still waiting. Answers `{ id, posEnabled }`.
 */
export async function setPosEnabled(rawRestaurantId: string, raw: PosEnabledInput) {
  const admin = await requireSuperAdmin()
  const restaurantId = uuid.parse(rawRestaurantId)
  const { enabled } = posEnabledInput.parse(raw)
  const row = await prisma.$transaction(async (tx) => {
    if (!enabled) await discardWaiting(tx, { restaurantId })
    return tx.restaurant.update({ where: { id: restaurantId }, data: { posEnabled: enabled }, select: { id: true, posEnabled: true } })
  })
  auditPos(admin, restaurantId, enabled ? 'enable' : 'disable', 'ok')
  return row
}
