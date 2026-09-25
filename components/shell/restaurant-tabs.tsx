'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { cn } from '@/lib/utils'
import { restaurantPath, type RestaurantPage } from '@/lib/restaurant-paths'
import type { ShellPortal } from './shell-types'

interface RestaurantTabsProps {
  portal: ShellPortal
  restaurantCode: string
  pathname: string
}

/** Sub-navigation shown while working inside one restaurant. */
function restaurantTabs(portal: ShellPortal, code: string) {
  const tab = (page: RestaurantPage) => restaurantPath(portal, code, page)
  const tabs: { href: Route; label: string }[] = [
    { href: tab('info'), label: 'Info' },
    { href: tab('menu'), label: 'Menu' },
    { href: tab('dishes'), label: 'Dishes' },
    // Orders inside the shell: the history, and the link to the tablet board (which is outside it).
    { href: tab('orders'), label: 'Orders' },
    { href: tab('tables'), label: 'Tables' },
    { href: tab('insights'), label: 'Insights' },
    { href: tab('edit'), label: 'Settings' },
    // Every restaurant has its people; what a reader may do with them is the page's business.
    { href: tab('users'), label: 'People' },
  ]
  return tabs
}

/** The strip of tabs under the top bar, the current one filled. */
export default function RestaurantTabs({ portal, restaurantCode, pathname }: RestaurantTabsProps) {
  return (
    <div className="scrollbar-none flex gap-1 overflow-x-auto px-4 pb-2 md:px-6">
      {restaurantTabs(portal, restaurantCode).map((tab) => {
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
