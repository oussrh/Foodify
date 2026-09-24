// app/actions/pos-connect-actions.ts
// Connecting a restaurant's POS from Settings → Integrations: signing in, testing, reading the
// locations and choosing one. The restaurant's owner, or a super admin acting
// for them (logged as such), and only once the super admin has switched POS on for it
// (`requirePosAccess`). Each answers an outcome the tab shows as it is; the work is server/pos/.
'use server'

import { requirePosAccess } from '@/lib/auth-guard'
import { uuid } from '@/lib/schemas/common'
import { posConnectInput, posLocationInput, type PosConnectInput, type PosLocationInput } from '@/lib/schemas/pos'
import { audited } from '@/server/pos/audit'
import { choosePosLocation as choose, connectPos as connect, listLocations, testPos as test, type PosOutcome } from '@/server/pos/setup'

/**
 * The restaurant's owner or a super admin, POS on. Parses `posConnectInput` and signs the restaurant in to that POS: the POS checks
 * the key, and only a key it took is sealed and stored. Answers the locations to choose from, or
 * why not (a provider coming soon, a key refused, no encryption key on this server).
 */
export async function connectPos(rawRestaurantId: string, raw: PosConnectInput) {
  const restaurantId = uuid.parse(rawRestaurantId)
  const actor = await requirePosAccess(restaurantId)
  const input = posConnectInput.parse(raw)
  return audited(actor, restaurantId, 'connect', await connect(restaurantId, input))
}

/** The same people. Asks the connected POS whether it still answers; a refusal marks the connection as needing attention. */
export async function testPos(rawRestaurantId: string): Promise<PosOutcome<{ message: string }>> {
  const restaurantId = uuid.parse(rawRestaurantId)
  const actor = await requirePosAccess(restaurantId)
  return audited(actor, restaurantId, 'test', await test(restaurantId))
}

/** The same people. The locations the signed-in POS lists now, read when the tab asks (at most 20 seconds), or why not. */
export async function listPosLocations(rawRestaurantId: string) {
  const restaurantId = uuid.parse(rawRestaurantId)
  await requirePosAccess(restaurantId)
  return listLocations(restaurantId)
}

/** The same people. Parses `posLocationInput` and chooses where tickets go: one of the locations the POS lists now. */
export async function choosePosLocation(rawRestaurantId: string, raw: PosLocationInput) {
  const restaurantId = uuid.parse(rawRestaurantId)
  const actor = await requirePosAccess(restaurantId)
  const { locationId } = posLocationInput.parse(raw)
  return audited(actor, restaurantId, 'location', await choose(restaurantId, locationId))
}
