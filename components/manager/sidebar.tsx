import Link from 'next/link'
import { Utensils, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export const managerLinks = [
  { href: '/manager/restaurants', label: 'Restaurants', icon: Utensils },
  { href: '/manager/profile', label: 'Profile', icon: User },
]

export default function ManagerSidebar({ className = '' }: { className?: string }) {
  return (
    <aside className={cn('w-64 border-r bg-muted/50', className)}>
      <nav className="flex flex-col gap-1 p-4 text-sm font-medium">
        {managerLinks.map(({ href, label, icon: Icon }: any) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 rounded-md px-2 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
