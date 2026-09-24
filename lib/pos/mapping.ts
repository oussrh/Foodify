// lib/pos/mapping.ts
// Matching the menu to the POS's items. A suggestion is only a suggestion: it is made on names,
// the owner confirms every one, and nothing is matched without them. Names are compared folded
// (case, accents and punctuation dropped), an exact fold first, then one name inside the other,
// so "Harira (bowl)" still finds "Harira"; a dish with no such item gets none.
import type { PosMenuItem } from './contract'

/** A name reduced to what matching reads: lower case, no accents, words of letters and digits. */
export function foldName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** The POS item a dish called `dishName` most likely is, or null when none is close enough. */
export function suggestItem(dishName: string, items: readonly PosMenuItem[]): PosMenuItem | null {
  const dish = foldName(dishName)
  if (!dish) return null
  const folded = items.map((item) => ({ item, name: foldName(item.name) })).filter((entry) => entry.name.length > 0)
  const exact = folded.find((entry) => entry.name === dish)
  if (exact) return exact.item
  const inside = folded.find((entry) => dish.includes(entry.name) || entry.name.includes(dish))
  return inside ? inside.item : null
}

/** One dish of the matching screen: what it is, the item suggested for it, and the item it is matched to now. */
export interface MappingRow {
  dishId: string
  name: string
  price: string
  suggestedItemId: string | null
  currentItemId: string | null
}

/**
 * Every active dish with its suggestion and its current match, in menu order. A current match to
 * an item the POS no longer lists is shown as unmatched rather than kept pointing at nothing.
 */
export function mappingRows(dishes: readonly { id: string; name: string; price: string }[], items: readonly PosMenuItem[], current: ReadonlyMap<string, string>): MappingRow[] {
  const listed = new Set(items.map((item) => item.id))
  return dishes.map((dish) => {
    const matched = current.get(dish.id)
    return {
      dishId: dish.id,
      name: dish.name,
      price: dish.price,
      suggestedItemId: suggestItem(dish.name, items)?.id ?? null,
      currentItemId: matched && listed.has(matched) ? matched : null,
    }
  })
}
