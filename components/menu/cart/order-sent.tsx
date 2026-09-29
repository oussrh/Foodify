// components/menu/cart/order-sent.tsx
// What the cart sheet shows once the server has taken the order: its number, the table it is
// going to, the way to follow it and the way back to the menu.
'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { type Locale } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import type { PlacedOrder } from '@/lib/schemas/order'

const BUTTON = 'inline-flex h-12 w-full max-w-xs items-center justify-center rounded-md px-6 text-[15px] font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring'

interface OrderSentProps {
  order: PlacedOrder
  /** The menu's slug: the order's tracking page is under it. */
  slug: string
  onDone: () => void
  locale: Locale
}

/**
 * What the cart shows once the server has taken the order: its number, its table, the way to
 * follow it, and the way back to the menu.
 */
export default function OrderSent({ order, slug, onDone, locale }: OrderSentProps) {
  const t = MENU_TEXT[locale]
  // No secret came back (a body off its shape): the order stands, but there is nothing to follow.
  const { token } = order
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <CheckCircle2 className="h-12 w-12 text-success" aria-hidden="true" />
      <p className="text-lg font-semibold">{t.orderSent(order.number)}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{t.orderSentHint(order.table)}</p>
      {token && (
        <Link href={`/restaurant/${slug}/order/${token}?lang=${locale}`} className={`${BUTTON} mt-3 bg-brand text-brand-on transition-opacity hover:opacity-90`}>
          {t.followOrder}
        </Link>
      )}
      <button type="button" onClick={onDone} className={`${BUTTON} border border-border-strong hover:bg-accent ${token ? '' : 'mt-3'}`}>
        {t.backToMenu}
      </button>
    </div>
  )
}
