// PathFile: components/manager/sidebar.tsx 
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Utensils, User, BarChart3, Home, ChefHat, Settings, Eye, Clock, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export const managerLinks = [
  { 
    href: '/manager', 
    label: 'Dashboard', 
    icon: Home,
    description: 'Overview & Insights'
  },
  { 
    href: '/manager/restaurants', 
    label: 'Restaurants', 
    icon: Utensils,
    description: 'Manage Your Venues'
  },
  { 
    href: '/manager/profile', 
    label: 'Profile', 
    icon: User,
    description: 'Account Settings'
  },
]

export default function ManagerSidebar({ className = '' }: { className?: string }) {
  const pathname = usePathname()

  return (
    <aside className={cn('w-64 h-screen border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60', className)}>
      {/* Sidebar Header */}
      <div className="border-b border-border/40 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <ChefHat className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-foreground leading-none">
              Foodify Manager
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Restaurant Management
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 p-4">
        {/* Main Navigation */}
        <div className="mb-4">
          <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Main
          </h3>
          <div className="space-y-1">
            {managerLinks.map(({ href, label, icon: Icon, description }: any) => {
              const isActive = pathname === href || (href !== '/manager' && pathname.startsWith(href))
              
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? "bg-accent text-accent-foreground shadow-sm border border-border/50"
                      : "text-muted-foreground hover:translate-x-1"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                    isActive 
                      ? "bg-blue-500 text-white shadow-sm" 
                      : "bg-muted group-hover:bg-accent-foreground/10"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="truncate">{label}</span>
                    <span className="text-xs text-muted-foreground/70 truncate">
                      {description}
                    </span>
                  </div>
                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-4">
          <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Quick Links
          </h3>
          <div className="space-y-1">
            <Link
              href="#"
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground/50 cursor-not-allowed transition-all duration-200"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="truncate">Analytics</span>
                <span className="text-xs text-muted-foreground/50">
                  Coming Soon
                </span>
              </div>
              <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400">
                Soon
              </Badge>
            </Link>
            <Link
              href="#"
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground/50 cursor-not-allowed transition-all duration-200"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50">
                <Eye className="h-4 w-4" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="truncate">Reports</span>
                <span className="text-xs text-muted-foreground/50">
                  Coming Soon
                </span>
              </div>
              <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400">
                Soon
              </Badge>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-4">
          <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Your Stats
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Utensils className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs font-medium text-foreground">Restaurants</span>
              </div>
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                3
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-medium text-foreground">Active Today</span>
              </div>
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                2
              </Badge>
            </div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200/50 dark:border-emerald-800/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
              Performance
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs text-emerald-700 dark:text-emerald-300">
              +12% this month
            </span>
          </div>
        </div>
      </nav>
    </aside>
  )
}
