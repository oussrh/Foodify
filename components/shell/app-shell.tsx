'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Building2,
  ChevronDown,
  Home,
  LogOut,
  Shield,
  User as UserIcon,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export type ShellRole = 'admin' | 'manager'

export interface ShellRestaurant {
  id: string
  name: string
}

interface AppShellProps {
  role: ShellRole
  user: { email: string }
  restaurants: ShellRestaurant[]
  children: React.ReactNode
}

interface NavItem {
  href: Route
  label: string
  icon: LucideIcon
  exact?: boolean
}

const NAV: Record<ShellRole, NavItem[]> = {
  admin: [
    { href: '/admin', label: 'Overview', icon: Home, exact: true },
    { href: '/admin/restaurants', label: 'Restaurants', icon: Building2 },
    { href: '/admin/users', label: 'Managers', icon: Users },
    { href: '/admin/admins', label: 'Admins', icon: Shield },
  ],
  manager: [
    { href: '/manager', label: 'Overview', icon: Home, exact: true },
    { href: '/manager/restaurants', label: 'Restaurants', icon: Building2 },
    { href: '/manager/profile', label: 'Account', icon: UserIcon },
  ],
}

/** Sub-navigation shown while working inside one restaurant. */
function restaurantTabs(role: ShellRole, id: string) {
  const base = `/${role}/restaurants/${id}`
  const tabs: { href: Route; label: string }[] = [
    { href: `${base}/info` as Route, label: 'Info' },
    { href: `${base}/menu` as Route, label: 'Menu' },
    { href: `${base}/dishes` as Route, label: 'Dishes' },
    { href: `${base}/edit` as Route, label: 'Settings' },
  ]
  if (role === 'admin') tabs.push({ href: `${base}/users` as Route, label: 'People' })
  return tabs
}

export default function AppShell({ role, user, restaurants, children }: AppShellProps) {
  const pathname = usePathname()
  const nav = NAV[role]

  // Are we inside /{role}/restaurants/{id}/... ?
  const match = pathname.match(new RegExp(`^/${role}/restaurants/([^/]+)(?:/([^/]+))?`))
  const restaurantId = match && match[1] !== 'create' ? match[1] : null
  const currentRestaurant = restaurantId ? restaurants.find((r) => r.id === restaurantId) : null
  const section = match?.[2] ?? 'info'

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href))
  const initials = user.email.slice(0, 2).toUpperCase()
  const loginPath = role === 'admin' ? '/admin/login' : '/manager/login'

  const userMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{user.email}</span>
          <span className="block text-xs text-muted-foreground">{role === 'admin' ? 'Super admin' : 'Restaurant manager'}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {role === 'manager' && (
          <DropdownMenuItem asChild>
            <Link href="/manager/profile">Account settings</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => signOut({ redirect: true, callbackUrl: loginPath })}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const switcher = currentRestaurant && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 max-w-[60vw] items-center gap-1.5 rounded-md border border-input bg-card px-3 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:max-w-xs"
        >
          <span className="truncate">{currentRestaurant.name}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch restaurant</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {restaurants.map((r) => (
          <DropdownMenuItem key={r.id} asChild>
            <Link href={`/${role}/restaurants/${r.id}/${section}` as Route} className={cn(r.id === restaurantId && 'font-semibold')}>
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Rail (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-[216px] shrink-0 flex-col border-r border-border bg-background px-3 py-4 md:flex">
        <Link href={`/${role}` as Route} className="flex items-center gap-2 px-2 pb-5 pt-1 font-semibold">
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
          {userMenu}
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{user.email}</span>
          <ThemeToggle size="icon-sm" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-4 md:px-6">
            <Link href={`/${role}` as Route} className="flex items-center gap-2 font-semibold md:hidden">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Foodify</span>
            </Link>
            {switcher}
            <div className="flex-1" />
            <div className="md:hidden">
              <ThemeToggle size="icon-sm" />
            </div>
            <div className="md:hidden">{userMenu}</div>
          </div>
          {currentRestaurant && (
            <div className="scrollbar-none flex gap-1 overflow-x-auto px-4 pb-2 md:px-6">
              {restaurantTabs(role, currentRestaurant.id).map((tab) => {
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
          )}
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
