'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { Building2, Home, Shield, User as UserIcon, Users, type LucideIcon } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import UserMenu from './user-menu'
import RestaurantSwitcher from './restaurant-switcher'
import RestaurantTabs from './restaurant-tabs'
import type { ShellRestaurant, ShellPortal } from './shell-types'

interface AppShellProps {
  portal: ShellPortal
  user: { email: string }
  restaurants: ShellRestaurant[]
  children: React.ReactNode
}

interface NavItem {
  href: Route
  label: string
  icon: LucideIcon
  exact?: boolean
  /** What lights the item, when that is wider than what it links to. */
  activePrefix?: string
}

const NAV: Record<ShellPortal, NavItem[]> = {
  admin: [
    { href: '/admin', label: 'Overview', icon: Home, exact: true },
    { href: '/admin/restaurants', label: 'Restaurants', icon: Building2 },
    { href: '/admin/users', label: 'Managers', icon: Users },
    { href: '/admin/admins', label: 'Admins', icon: Shield },
    { href: '/admin/profile', label: 'Account', icon: UserIcon },
  ],
  manager: [
    { href: '/manager', label: 'Overview', icon: Home, exact: true },
    { href: '/manager/restaurants', label: 'Restaurants', icon: Building2 },
    { href: '/manager/profile', label: 'Account', icon: UserIcon },
  ],
}

/**
 * The rail and the phone tabs. A manager with one restaurant has no portfolio to browse: the
 * Restaurants item would open a list of one, so it is dropped and Overview goes straight into
 * that restaurant — which is where `/manager` itself lands them.
 */
function navFor(portal: ShellPortal, restaurants: ShellRestaurant[]): NavItem[] {
  const only = portal === 'manager' && restaurants.length === 1 ? restaurants[0]! : null
  if (!only) return NAV[portal]
  const home = `/manager/restaurants/${only.id}`
  return [
    { href: `${home}/info` as Route, label: 'Overview', icon: Home, activePrefix: home },
    { href: '/manager/profile', label: 'Account', icon: UserIcon },
  ]
}

/**
 * The one shell of both portals: the side rail on a desktop, the top bar with the restaurant
 * switcher, and the bottom tabs on a phone.
 */
export default function AppShell({ portal, user, restaurants, children }: AppShellProps) {
  const pathname = usePathname()
  const nav = navFor(portal, restaurants)

  // Are we inside /{portal}/restaurants/{id}/... ?
  const match = pathname.match(new RegExp(`^/${portal}/restaurants/([^/]+)(?:/([^/]+))?`))
  const restaurantId = match && match[1] !== 'create' ? match[1] : null
  const currentRestaurant = restaurantId ? restaurants.find((r) => r.id === restaurantId) : null
  const section = match?.[2] ?? 'info'

  const isActive = (item: NavItem) => {
    const lit = item.activePrefix ?? item.href
    return item.exact ? pathname === lit : pathname.startsWith(lit)
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Rail (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-[216px] shrink-0 flex-col border-r border-border bg-background px-3 py-4 md:flex">
        <Link href={`/${portal}` as Route} className="flex items-center gap-2 px-2 pb-5 pt-1 font-semibold">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
          Foodify
        </Link>
        <nav className="flex flex-col gap-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                isActive(item) ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
          <UserMenu portal={portal} user={user} />
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{user.email}</span>
          <ThemeToggle size="icon-sm" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex h-14 items-center gap-2 px-4 md:px-6">
            <Link href={`/${portal}` as Route} className="flex items-center gap-2 font-semibold md:hidden">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Foodify</span>
            </Link>
            {currentRestaurant && <RestaurantSwitcher portal={portal} restaurants={restaurants} current={currentRestaurant} section={section} />}
            <div className="flex-1" />
            <div className="md:hidden">
              <ThemeToggle size="icon-sm" />
            </div>
            <div className="md:hidden">
              <UserMenu portal={portal} user={user} />
            </div>
          </div>
          {currentRestaurant && <RestaurantTabs portal={portal} restaurantId={currentRestaurant.id} pathname={pathname} />}
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 pb-24 md:px-6 md:py-6 md:pb-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Bottom tabs (phone) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-card md:hidden"
        style={{
          gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item) ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-1 py-2 text-[11px] font-medium',
              isActive(item) ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <item.icon className={cn('h-5 w-5', isActive(item) && 'text-primary')} />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
