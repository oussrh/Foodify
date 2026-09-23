// components/menu/restaurant-page/use-menu-cart.ts
// What the menu page needs of the cart in one place: the store, the lines joined to the dishes
// on the page, the subtotal, the sheet's open state, and the order handles the rows and the
// dish sheet take. A restaurant with ordering off gets a cart that is never shown: `enabled`
// is false and every handle is undefined.
'use client'

import { useMemo, useState } from 'react'
import type { MenuCategory, MenuDish, MenuRestaurant } from '@/lib/menu'
import { cartLineViews, cartSubtotal, dishesById, type CartLineView } from '../cart/cart-lines'
import type { DishOrder } from '../cart/dish-order-control'
import { useCart, type CartApi } from '../cart/use-cart'
import { trackCartAdd } from '../track'

export interface MenuCart {
  enabled: boolean
  cart: CartApi
  /** The table came from `?table=` in the QR link: the order form shows it instead of asking. */
  tableLocked: boolean
  lines: CartLineView[]
  subtotal: string
  count: number
  open: boolean
  setOpen: (open: boolean) => void
  /** How many of a dish are in the order and the way to add one, for a menu row. */
  rowOrder: (dish: MenuDish) => { quantity: number; onAdd: () => void } | undefined
  /** The quantity, the note and the ways to set them, for the dish sheet. */
  dishOrder: (dish: MenuDish | null) => DishOrder | undefined
}

/**
 * What the menu page needs of the cart: the store, the lines joined to the page's dishes, the
 * subtotal, the sheet's state and each row's order handle; inert when ordering is off.
 */
export function useMenuCart(
  restaurant: MenuRestaurant,
  categories: MenuCategory[],
  uncategorizedDishes: MenuDish[],
  urlTable?: string | null,
): MenuCart {
  const cart = useCart(restaurant.id, urlTable)
  const [open, setOpen] = useState(false)
  const enabled = restaurant.orderingEnabled

  const dishes = useMemo(() => dishesById(categories, uncategorizedDishes), [categories, uncategorizedDishes])
  const lines = useMemo(() => cartLineViews(cart.cart, dishes), [cart.cart, dishes])
  const subtotal = useMemo(() => cartSubtotal(lines), [lines])
  // A dish the menu no longer has is already out of `lines`, so the bar counts what the sheet shows.
  const count = lines.reduce((n, line) => n + line.quantity, 0)

  const add = (dishId: string) => {
    cart.addOne(dishId)
    trackCartAdd(dishId)
  }

  return {
    enabled,
    cart,
    tableLocked: Boolean(urlTable),
    lines,
    subtotal,
    count,
    open: open && enabled,
    setOpen,
    // The two ways a guest adds, and the only two places the add is counted: the waiter app
    // shares the cart store but not this hook, and a staff order is counted as an order.
    // A dish the kitchen has run out of has no handle at all, so neither the row's + nor the
    // sheet's stepper exists to be tapped. The endpoint refuses it as well: a cart is built in
    // the guest's browser and can be minutes old by the time it is sent.
    rowOrder: (dish) =>
      enabled && !dish.soldOut ? { quantity: cart.quantityOf(dish.id), onAdd: () => add(dish.id) } : undefined,
    dishOrder: (dish) =>
      enabled && dish && !dish.soldOut
        ? {
            quantity: cart.quantityOf(dish.id),
            onChange: (quantity: number) => {
              // Only upwards: a stepper coming back down is the guest changing their mind.
              if (quantity > cart.quantityOf(dish.id)) trackCartAdd(dish.id)
              cart.setQuantity(dish.id, quantity)
            },
            note: cart.noteOf(dish.id),
            onNote: (note: string) => cart.setNote(dish.id, note),
          }
        : undefined,
  }
}
