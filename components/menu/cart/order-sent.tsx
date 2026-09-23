// components/menu/cart/order-sent.tsx
// What the cart sheet shows once the server has taken the order: its number, the table it is
// going to, and the way back to the menu.
'use client'

import { CheckCircle2 } from 'lucide-react'
import { type Locale } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import type { PlacedOrder } from '@/lib/schemas/order'

/**
 * What the cart shows once the server has taken the order: its number, its table, and the way back
 * to the menu.
 */
export default function OrderSent({ order, onDone, locale }: { order: PlacedOrder; onDone: () => void; locale: Locale }) {
  const t = MENU_TEXT[locale]
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <CheckCircle2 className="h-12 w-12 text-success" aria-hidden="true" />
      <p className="text-lg font-semibold">{t.orderSent(order.number)}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{t.orderSentHint(order.table)}</p>
      <button
        type="button"
        onClick={onDone}
        className="mt-3 inline-flex h-12 items-center justify-center rounded-md border border-border-strong px-6 text-[15px] font-semibold hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t.backToMenu}
      </button>
    </div>
  )
}
