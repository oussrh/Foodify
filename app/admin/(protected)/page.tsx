// FilePath: app/admin/(protected)/page.tsx
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, StatStrip } from '@/components/shell/page-header'
import { DashboardRestaurants } from '@/components/admin/dashboard-restaurants'
import { RecentManagers } from '@/components/admin/dashboard-managers'
import { daysAgo } from '@/lib/time'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export default async function AdminDashboard() {
  await requireSuperAdminPage()
  const [restaurants, managers, admins, dishTotals, liveDishes, arDishes, views, recentManagers] = await Promise.all([
    prisma.restaurant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { dishes: true, categories: true, users: true } },
      },
    }),
    prisma.user.count({ where: { role: 'RESTAURANT_ADMIN' } }),
    prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
    prisma.dish.count(),
    prisma.dish.count({ where: { isActive: true } }),
    prisma.dish.count({ where: { OR: [{ usdzUrl: { not: '' } }, { glbUrl: { not: '' } }] } }),
    prisma.dishView.count({ where: { viewedAt: { gte: daysAgo(7) } } }),
    prisma.user.findMany({
      where: { role: 'RESTAURANT_ADMIN' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, email: true, lastLogin: true, restaurants: { select: { id: true, name: true } } },
    }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Overview"
        description="Everything on the platform, at a glance."
        actions={
          <Button asChild>
            <Link href="/admin/restaurants/create">
              <Plus className="h-4 w-4" />
              Add restaurant
            </Link>
          </Button>
        }
      />

      <StatStrip
        stats={[
          { label: 'Restaurants', value: restaurants.length },
          { label: 'Managers', value: managers, hint: `${admins} admin${admins === 1 ? '' : 's'}` },
          { label: 'Dishes', value: dishTotals, hint: `${liveDishes} live · ${arDishes} AR ready` },
          { label: 'Menu views, 7 days', value: views.toLocaleString() },
        ]}
      />

      <DashboardRestaurants restaurants={restaurants} />

      <RecentManagers managers={recentManagers} />
    </div>
  )
}
