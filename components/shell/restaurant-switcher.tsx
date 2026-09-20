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
import type { ShellRestaurant, ShellRole } from './shell-types'

interface RestaurantSwitcherProps {
  role: ShellRole
  restaurants: ShellRestaurant[]
  current: ShellRestaurant
  /** The section open right now (info, menu, dishes...), kept when switching */
  section: string
}

/** The current restaurant's name in the top bar; opens the list of the others at the same section. */
export default function RestaurantSwitcher({ role, restaurants, current, section }: RestaurantSwitcherProps) {
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
            <Link href={`/${role}/restaurants/${r.id}/${section}` as Route} className={cn(r.id === current.id && 'font-semibold')}>
              {r.name}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${role}/restaurants` as Route}>All restaurants</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
