// PathFile: components/admin/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Utensils, Users, Settings, Shield, ChefHat, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export const adminLinks = [
  { 
    href: '/admin', 
    label: 'Dashboard', 
    icon: Home,
    description: 'Overview & Analytics'
  },
  { 
    href: '/admin/restaurants', 
    label: 'Restaurants', 
    icon: Utensils,
    description: 'Manage Venues'
  },
  { 
    href: '/admin/users', 
    label: 'Users', 
    icon: Users,
    description: 'User Management'
  },
  { 
    href: '/admin/admins', 
    label: 'Admins', 
    icon: Shield,
    description: 'Administrator Accounts'
  },
  { 
    href: '/admin/settings', 
    label: 'Settings', 
    icon: Settings,
    description: 'System Configuration'
  },
]

export default function AdminSidebar({ className = '' }: { className?: string }) {
  const pathname = usePathname()

  return (
    <aside className={cn('w-64 h-screen border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60', className)}>
      {/* Sidebar Header */}
      <div className="border-b border-border/40 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
            <ChefHat className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-foreground leading-none">
              Foodify
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Admin Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 p-4">
        <div className="mb-2">
          <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </h3>
          <div className="space-y-1">
            {adminLinks.map(({ href, label, icon: Icon, description }: any) => {
              const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
              
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
                      ? "bg-primary text-primary-foreground shadow-sm" 
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
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="mt-6 pt-4 border-t border-border/40">
          <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Quick Stats
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BarChart3 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-medium text-foreground">Active Users</span>
              </div>
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                24
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Utensils className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs font-medium text-foreground">Restaurants</span>
              </div>
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                12
              </Badge>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-800 dark:text-green-200">
              System Status
            </span>
          </div>
          <p className="text-xs text-green-700 dark:text-green-300">
            All systems operational
          </p>
        </div>
      </nav>
    </aside>
  )
}
