'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { cn } from '@/lib/utils'
import type { ShellPortal } from './shell-types'

interface RestaurantTabsProps {
  portal: ShellPortal
  restaurantId: string
  pathname: string
}

/** Sub-navigation shown while working inside one restaurant. */
function restaurantTabs(portal: ShellPortal, id: string) {
  const base = `/${portal}/restaurants/${id}`
  const tabs: { href: Route; label: string }[] = [
    { href: `${base}/info` as Route, label: 'Info' },
    { href: `${base}/menu` as Route, label: 'Menu' },
    { href: `${base}/dishes` as Route, label: 'Dishes' },
    // Orders inside the shell: the history, and the link to the tablet board (which is outside it).
    { href: `${base}/orders` as Route, label: 'Orders' },
    { href: `${base}/tables` as Route, label: 'Tables' },
    { href: `${base}/insights` as Route, label: 'Insights' },
    { href: `${base}/edit` as Route, label: 'Settings' },
    // Every restaurant has its people; what a reader may do with them is the page's business.
    { href: `${base}/users` as Route, label: 'People' },
  ]
  return tabs
}

/** The strip of tabs under the top bar, the current one filled. */
export default function RestaurantTabs({ portal, restaurantId, pathname }: RestaurantTabsProps) {
  return (
    <div className="scrollbar-none flex gap-1 overflow-x-auto px-4 pb-2 md:px-6">
      {restaurantTabs(portal, restaurantId).map((tab) => {
        const active = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'h-8 shrink-0 whitespace-nowrap rounded-full px-3 text-[13px] font-medium leading-8 transition-colors',
              active ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
