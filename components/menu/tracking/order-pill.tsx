// components/menu/tracking/order-pill.tsx
// "Your order #12 · Being prepared": a small line above the cart bar while the guest has an order
// the kitchen has not finished, and the way to the page that follows it.
'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { guestStatus } from '@/lib/guest-status'
import { type Locale } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import type { ActiveOrder } from './use-active-order'

/** The guest's order in one line, linking to its tracking page. */
export default function OrderPill({ order, slug, locale }: { order: ActiveOrder; slug: string; locale: Locale }) {
  const t = MENU_TEXT[locale]
  return (
    <Link
      href={`/restaurant/${slug}/order/${order.token}?lang=${locale}`}
      className="mx-auto flex h-10 w-full max-w-lg items-center gap-2.5 rounded-full border border-border-strong bg-card px-4 text-sm hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-brand motion-safe:animate-pulse" aria-hidden="true" />
      <span className="min-w-0 truncate">
        <span className="font-semibold">{t.yourOrderNumber(order.number)}</span>
        <span className="text-muted-foreground"> · {t.orderStatus[guestStatus(order.status)]}</span>
      </span>
      <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}
