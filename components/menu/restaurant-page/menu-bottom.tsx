// components/menu/restaurant-page/menu-bottom.tsx
// What rises from the bottom of the menu: the guest's order still with the kitchen (the pill),
// and the order being built (the cart bar), stacked in one bar so neither covers the other.
// Nothing at all when the guest has neither.
'use client'

import { type Locale, type Money } from '@/lib/menu'
import CartBar from '../cart/cart-bar'
import OrderPill from '../tracking/order-pill'
import { useActiveOrder } from '../tracking/use-active-order'

interface MenuBottomProps {
  restaurantId: string
  slug: string
  /** How many items the order being built holds, and what they come to. */
  count: number
  subtotal: string
  onOpenCart: () => void
  locale: Locale
  money: Money
}

/** The bottom bar of the menu: the order being followed, then the order being built. */
export default function MenuBottom({ restaurantId, slug, count, subtotal, onOpenCart, locale, money }: MenuBottomProps) {
  const active = useActiveOrder(restaurantId)
  if (!active && count === 0) return null
  return (
    <div className="sticky bottom-0 z-40 space-y-2 border-t border-border bg-background/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
      {active && <OrderPill order={active} slug={slug} locale={locale} />}
      <CartBar count={count} subtotal={subtotal} onOpen={onOpenCart} locale={locale} money={money} />
    </div>
  )
}
