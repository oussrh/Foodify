// components/menu/cart/cart-bar.tsx
// The bar that rises from the bottom of the menu once something is in the order: how many
// items, the subtotal, and the way into the cart sheet. Nothing is shown for an empty order.
'use client'

import { ShoppingBag } from 'lucide-react'
import { formatPrice, type Locale, type Money } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'

interface CartBarProps {
  count: number
  subtotal: string
  onOpen: () => void
  locale: Locale
  money: Money
}

/**
 * The bar that rises from the bottom of the menu once the order has something in it: the count, the
 * subtotal, and the way into the cart.
 */
export default function CartBar({ count, subtotal, onOpen, locale, money }: CartBarProps) {
  const t = MENU_TEXT[locale]
  if (count === 0) return null
  return (
    <div className="sticky bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
      <button
        type="button"
        onClick={onOpen}
        className="mx-auto flex h-12 w-full max-w-lg items-center gap-3 rounded-md bg-brand px-4 text-[15px] font-semibold text-brand-on transition-opacity hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{t.viewOrder}</span>
        <span className="ml-auto flex items-center gap-3">
          <span className="tnum opacity-90">{t.items(count)}</span>
          <span className="tnum">{formatPrice(subtotal, money)}</span>
        </span>
      </button>
    </div>
  )
}
