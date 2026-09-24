// server/pos/mapping.ts
// Matching the restaurant's dishes to the POS's items: the POS's menu read now, every active dish
// with the item its name suggests (lib/pos/mapping.ts) and the item it is matched to, and the
// owner's confirmed matches saved with the POS's price at that moment. Saving also marks the menu
// changes the POS reported as reviewed, since reviewing the matches is what they asked for. The
// caller has guarded the restaurant.
import prisma from '@/lib/prisma'
import { answerOf, type PosMenuItem } from '@/lib/pos/contract'
import { mappingRows, type MappingRow } from '@/lib/pos/mapping'
import { MAX_MAPPED_DISHES, type PosMappingInput } from '@/lib/schemas/pos'
import { openAdapter, readConnection } from '@/server/pos/connection'
import type { PosOutcome } from '@/server/pos/setup'

/** States in which a connection has a location and its dishes can be matched. */
const MATCHABLE = new Set(['MAPPING', 'ACTIVE', 'PAUSED'])

/** The connection and the POS's menu as it stands now, or why neither can be read. */
async function posMenu(restaurantId: string): Promise<PosOutcome<{ connectionId: string; items: PosMenuItem[] }>> {
  const connection = await readConnection(restaurantId)
  if (!connection || !MATCHABLE.has(connection.status)) return { ok: false, error: 'Choose a location first' }
  const opened = openAdapter(connection)
  if ('error' in opened) return { ok: false, error: opened.error }
  const { adapter } = opened
  const answer = await answerOf(() => adapter.readMenu())
  if (answer.kind !== 'ok') return { ok: false, error: answer.reason }
  return { ok: true, connectionId: connection.id, items: answer.items }
}

/** Every active dish of `restaurantId`, in menu order, its price as an exact decimal string. */
async function activeDishes(restaurantId: string) {
  const dishes = await prisma.dish.findMany({
    where: { restaurantId, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    select: { id: true, nameEn: true, price: true },
    take: MAX_MAPPED_DISHES,
  })
  return dishes.map((dish) => ({ id: dish.id, name: dish.nameEn, price: dish.price.toFixed(2) }))
}

/** The matching screen: the POS's items, and every active dish with its suggestion and current match. */
export async function readPosMenu(restaurantId: string): Promise<PosOutcome<{ items: PosMenuItem[]; rows: MappingRow[] }>> {
  const menu = await posMenu(restaurantId)
  if (!menu.ok) return menu
  const current = await prisma.posItemMap.findMany({ where: { connectionId: menu.connectionId }, select: { dishId: true, externalItemId: true }, take: MAX_MAPPED_DISHES })
  const rows = mappingRows(await activeDishes(restaurantId), menu.items, new Map(current.map((row) => [row.dishId, row.externalItemId])))
  return { ok: true, items: menu.items, rows }
}

/**
 * Saves the owner's matches: each dish to the POS item named, with the POS's price now, or
 * unmatched when the item is null. Every dish must be this restaurant's and every item one the
 * POS lists now; otherwise nothing is saved.
 */
export async function savePosMapping(restaurantId: string, input: PosMappingInput): Promise<PosOutcome<{ mapped: number }>> {
  const menu = await posMenu(restaurantId)
  if (!menu.ok) return menu
  const ids = input.items.map((item) => item.dishId)
  const owned = await prisma.dish.count({ where: { id: { in: ids }, restaurantId } })
  if (owned !== ids.length) return { ok: false, error: 'A dish is not on this menu' }
  const priceOf = new Map(menu.items.map((item) => [item.id, item.price]))
  if (input.items.some((item) => item.externalItemId !== null && !priceOf.has(item.externalItemId))) return { ok: false, error: 'An item is no longer on the POS' }

  const { connectionId } = menu
  await prisma.$transaction(async (tx) => {
    for (const { dishId, externalItemId } of input.items) {
      const price = externalItemId === null ? undefined : priceOf.get(externalItemId)
      if (externalItemId === null || price === undefined) await tx.posItemMap.deleteMany({ where: { connectionId, dishId } })
      else await tx.posItemMap.upsert({ where: { connectionId_dishId: { connectionId, dishId } }, create: { connectionId, dishId, externalItemId, externalPrice: price }, update: { externalItemId, externalPrice: price }, select: { id: true } })
    }
    await tx.posInbox.updateMany({ where: { connectionId, kind: 'MENU_CHANGED', appliedAt: null }, data: { appliedAt: new Date() } })
  })
  return { ok: true, mapped: input.items.filter((item) => item.externalItemId !== null).length }
}
