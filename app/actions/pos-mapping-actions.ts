// app/actions/pos-mapping-actions.ts
// Matching the menu to the POS and switching the connection on: the POS's items with a suggestion
// for every dish, the owner's confirmed matches, and Activate. The restaurant's owner or a super
// admin acting for them (logged as such) (`requireRestaurantAccess`).
'use server'

import { requireRestaurantAccess } from '@/lib/auth-guard'
import { uuid } from '@/lib/schemas/common'
import { posMappingInput, type PosMappingInput } from '@/lib/schemas/pos'
import { audited } from '@/server/pos/audit'
import { movePos } from '@/server/pos/control'
import { readPosMenu as readMenu, savePosMapping as saveMapping } from '@/server/pos/mapping'

/** The restaurant's owner or a super admin. Answers the POS's items and every active dish with its suggested and current match. */
export async function readPosMenu(rawRestaurantId: string) {
  const restaurantId = uuid.parse(rawRestaurantId)
  await requireRestaurantAccess({ id: restaurantId })
  return readMenu(restaurantId)
}

/**
 * The same people. Parses `posMappingInput` and saves the matches, each with the POS's price now;
 * a dish of another restaurant or an item the POS no longer lists saves nothing. Answers how many
 * dishes are matched.
 */
export async function savePosMapping(rawRestaurantId: string, raw: PosMappingInput) {
  const restaurantId = uuid.parse(rawRestaurantId)
  const actor = await requireRestaurantAccess({ id: restaurantId })
  const input = posMappingInput.parse(raw)
  return audited(actor, restaurantId, 'mapping', await saveMapping(restaurantId, input))
}

/** The same people. Switches a matched connection on: from now on tickets, changes and closes are queued and sent. */
export async function activatePos(rawRestaurantId: string) {
  const restaurantId = uuid.parse(rawRestaurantId)
  const actor = await requireRestaurantAccess({ id: restaurantId })
  return audited(actor, restaurantId, 'activate', await movePos(restaurantId, 'activate'))
}
