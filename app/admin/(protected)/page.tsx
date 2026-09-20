// FilePath: app/admin/(protected)/page.tsx
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState, PageHeader, StatStrip } from '@/components/shell/page-header'
import { RestaurantRowMenu } from '@/components/shell/row-actions'
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

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Restaurants</h2>
          <Link href="/admin/restaurants" className="text-sm text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>
        {restaurants.length === 0 ? (
          <EmptyState
            title="No restaurants yet"
            description="Create the first restaurant, then assign a manager to it."
            action={
              <Button asChild>
                <Link href="/admin/restaurants/create">Add restaurant</Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead className="hidden sm:table-cell">City</TableHead>
                <TableHead>Dishes</TableHead>
                <TableHead className="hidden md:table-cell">Managers</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="w-[1%]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurants.slice(0, 8).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/admin/restaurants/${r.id}/menu`} className="font-medium hover:underline">
                      {r.name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">/{r.slug}</span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{r.city || '—'}</TableCell>
                  <TableCell className="tnum">
                    {r._count.dishes}
                    <span className="text-muted-foreground"> · {r._count.categories} cat.</span>
                  </TableCell>
                  <TableCell className="tnum hidden md:table-cell">{r._count.users}</TableCell>
                  <TableCell className="tnum hidden text-muted-foreground lg:table-cell">
                    {r.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <RestaurantRowMenu restaurantId={r.id} restaurantName={r.name} role="admin" slug={r.slug} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Recently added managers</h2>
          <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>
        {recentManagers.length === 0 ? (
          <EmptyState title="No managers yet" description="Managers are the people who edit a restaurant's menu." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Manager</TableHead>
                <TableHead>Restaurants</TableHead>
                <TableHead className="hidden sm:table-cell">Last sign-in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentManagers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Link href={`/admin/users/${u.id}/edit`} className="font-medium hover:underline">
                      {u.email}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.restaurants.length === 0 ? '—' : u.restaurants.map((r) => r.name).join(', ')}
                  </TableCell>
                  <TableCell className="tnum hidden text-muted-foreground sm:table-cell">
                    {u.lastLogin ? u.lastLogin.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Never'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}
