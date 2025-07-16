import Link from 'next/link'
import { Home, Utensils, Users, Settings } from 'lucide-react'

const links = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/restaurants', label: 'Restaurants', icon: Utensils },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar() {
  return (
    <aside className="hidden w-64 border-r bg-muted/50 md:block">
      <nav className="flex flex-col gap-1 p-4 text-sm font-medium">
        {links.map(({ href, label, icon: Icon }) => (
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
