// components/menu/cart/cart-lines.ts
// The cart's stored ids and counts joined to the dishes the page is showing: what the sheet
// renders, the subtotal, and the body POST /api/orders takes. A line whose dish the menu no
// longer has is dropped here, so the sheet never shows a dish the kitchen cannot make.
import type { Cart, CartLine } from '@/lib/cart'
import { sumPrices } from '@/lib/money'
import type { MenuCategory, MenuDish } from '@/lib/menu'

/** One line of the order as the sheet shows it: the dish itself, how many, and what was asked for on it. */
export interface CartLineView {
  dish: MenuDish
  quantity: number
  note: string
}

/** Every dish the page is showing, by id: the categories' dishes and the uncategorized ones. */
export function dishesById(categories: MenuCategory[], uncategorized: MenuDish[]): Map<string, MenuDish> {
  const map = new Map<string, MenuDish>()
  for (const dish of uncategorized) map.set(dish.id, dish)
  for (const category of categories) {
    for (const sub of category.subcategories) {
      for (const dish of sub.dishes) map.set(dish.id, dish)
    }
  }
  return map
}

/** The cart's lines in the order they were added, each with its dish; a line whose dish is gone is left out. */
export function cartLineViews(cart: Cart, dishes: Map<string, MenuDish>): CartLineView[] {
  return cart.lines.flatMap((line) => {
    const dish = dishes.get(line.dishId)
    return dish ? [{ dish, quantity: line.quantity, note: line.note ?? '' }] : []
  })
}

/** The lines as POST /api/orders takes them: what the sheet is showing, ids and counts with the notes, each trimmed as it leaves. */
export function cartLinesToSend(views: CartLineView[]): CartLine[] {
  return views.map((v) => {
    const note = v.note.trim()
    return note ? { dishId: v.dish.id, quantity: v.quantity, note } : { dishId: v.dish.id, quantity: v.quantity }
  })
}

/** What the lines come to, as an exact two-decimal string; the server computes its own from the database. */
export function cartSubtotal(views: CartLineView[]): string {
  return sumPrices(views.map((v) => ({ price: v.dish.price, quantity: v.quantity })))
}
