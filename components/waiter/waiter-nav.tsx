// components/waiter/waiter-nav.tsx
// The tab bar along the bottom, where a phone's controls belong: a thumb reaches the bottom of a
// screen and not the top of it. It is on the two top-level screens and deliberately not on the
// order screen — a drill-in hides the tabs and shows a back arrow, which is what every phone app
// does and what a waiter already has the muscle memory for.
'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { Ban, LayoutGrid, ReceiptText } from 'lucide-react'
import { cn } from '@/lib/utils'

export type WaiterTab = 'tables' | 'orders' | 'soldOut'

/** Sits above the home indicator on a phone; the screens above it pad their own bottom to match. */
export function WaiterNav({ restaurantId, active }: { restaurantId: string; active: WaiterTab }) {
  const tabs = [
    { key: 'tables' as const, label: 'Tables', icon: LayoutGrid, href: `/waiter/${restaurantId}` as Route },
    { key: 'orders' as const, label: 'Orders', icon: ReceiptText, href: `/waiter/${restaurantId}/orders` as Route },
    { key: 'soldOut' as const, label: 'Sold out', icon: Ban, href: `/waiter/${restaurantId}/availability` as Route },
  ]

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-sm"
    >
      {tabs.map((tab) => {
        const current = tab.key === active
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={current ? 'page' : undefined}
            className={cn(
              'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium',
              current ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <tab.icon className={cn('h-6 w-6', current && 'text-primary')} aria-hidden="true" />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
