'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { ShellRestaurant, ShellPortal } from './shell-types'

interface RestaurantSwitcherProps {
  portal: ShellPortal
  restaurants: ShellRestaurant[]
  current: ShellRestaurant
  /** The section open right now (info, menu, dishes...), kept when switching */
  section: string
}

/**
 * The current restaurant's name in the top bar; opens the list of the others at the same section.
 * With nothing to switch to it is not a control: a reader who manages one restaurant was being
 * offered a menu whose every entry led back to the page they were already on. The name stays,
 * because it still says which restaurant the tabs below belong to.
 */
export default function RestaurantSwitcher({ portal, restaurants, current, section }: RestaurantSwitcherProps) {
  if (restaurants.length < 2) {
    return <span className="max-w-[60vw] truncate text-sm font-medium md:max-w-xs">{current.name}</span>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 max-w-[60vw] items-center gap-1.5 rounded-md border border-input bg-card px-3 text-sm font-medium hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring md:max-w-xs"
        >
          <span className="truncate">{current.name}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch restaurant</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {restaurants.map((r) => (
          <DropdownMenuItem key={r.id} asChild>
            <Link href={`/${portal}/restaurants/${r.id}/${section}` as Route} className={cn(r.id === current.id && 'font-semibold')}>
              {r.name}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${portal}/restaurants` as Route}>All restaurants</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
