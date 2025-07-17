import Link from 'next/link'
import { Utensils, User, BarChart3, Home, ChefHat, Settings, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

export const managerLinks = [
  { href: '/manager', label: 'Dashboard', icon: Home },
  { href: '/manager/restaurants', label: 'Restaurants', icon: Utensils },
  { href: '/manager/profile', label: 'Profile', icon: User },
]

export default function ManagerSidebar({ className = '' }: { className?: string }) {
  return (
    <aside className={cn('w-64 border-r bg-muted/50', className)}>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-foreground">Foodify Manager</h2>
        <p className="text-sm text-muted-foreground">Restaurant Management</p>
      </div>
      
      <nav className="flex flex-col gap-1 p-4 pt-0 text-sm font-medium">
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Main</h3>
          {managerLinks.map(({ href, label, icon: Icon }: any) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>

        <div className="mb-4">
          <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Links</h3>
          <Link
            href="#"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors opacity-50 cursor-not-allowed"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics (Soon)
          </Link>
          <Link
            href="#"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors opacity-50 cursor-not-allowed"
          >
            <Eye className="h-4 w-4" />
            Reports (Soon)
          </Link>
        </div>
      </nav>
    </aside>
  )
}
