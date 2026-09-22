import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState, PageHeader, StatStrip } from '@/components/shell/page-header'
import { RestaurantRowMenu } from '@/components/shell/row-actions'
import { daysAgo } from '@/lib/time'

export default async function ManagerDashboard() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  const since = daysAgo(7)

  const restaurants = await prisma.restaurant.findMany({
    where: { users: { some: { email: session.user.email } } },
    orderBy: { name: 'asc' },
    include: {
      dishes: { select: { id: true, isActive: true, usdzUrl: true, glbUrl: true } },
      _count: { select: { categories: true } },
    },
  })

  // One restaurant is not a portfolio: this page would be a table of one row above a strip of
  // numbers the restaurant's own Info tab already says. Their home is the restaurant.
  if (restaurants.length === 1) redirect(`/manager/restaurants/${restaurants[0]!.id}/info` as Route)

  const restaurantIds = restaurants.map((r) => r.id)
  const [views, arViews] = await Promise.all([
    prisma.dishView.count({ where: { viewedAt: { gte: since }, dish: { restaurantId: { in: restaurantIds } } } }),
    prisma.dishView.count({ where: { viewedAt: { gte: since }, arViewed: true, dish: { restaurantId: { in: restaurantIds } } } }),
  ])

  const allDishes = restaurants.flatMap((r) => r.dishes)
  const live = allDishes.filter((d) => d.isActive).length
  const arReady = allDishes.filter((d) => d.usdzUrl || d.glbUrl).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Overview" description={`Signed in as ${session.user.email}`} />

      <StatStrip
        stats={[
          { label: 'Restaurants', value: restaurants.length },
          { label: 'Dishes', value: allDishes.length, hint: `${live} live` },
          { label: 'AR ready', value: arReady },
          { label: 'Menu views, 7 days', value: views.toLocaleString(), hint: arViews > 0 ? `${arViews} AR sessions` : undefined },
        ]}
      />

      {restaurants.length === 0 ? (
        <EmptyState
          title="No restaurant assigned yet"
          description="Ask your Foodify administrator to add you to a restaurant. It will appear here as soon as they do."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant</TableHead>
              <TableHead className="hidden sm:table-cell">Categories</TableHead>
              <TableHead>Dishes</TableHead>
              <TableHead className="hidden md:table-cell">AR ready</TableHead>
              <TableHead className="w-[1%] text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {restaurants.map((r) => {
              const rLive = r.dishes.filter((d) => d.isActive).length
              const rAr = r.dishes.filter((d) => d.usdzUrl || d.glbUrl).length
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/manager/restaurants/${r.id}/menu`} className="font-medium hover:underline">
                      {r.name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">/{r.slug}</span>
                  </TableCell>
                  <TableCell className="tnum hidden sm:table-cell">{r._count.categories}</TableCell>
                  <TableCell className="tnum">
                    {r.dishes.length}
                    {r.dishes.length > 0 && <span className="text-muted-foreground"> · {rLive} live</span>}
                  </TableCell>
                  <TableCell className="tnum hidden md:table-cell">{rAr}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
                        <Link href={`/manager/restaurants/${r.id}/menu`}>Menu</Link>
                      </Button>
                      <RestaurantRowMenu restaurantId={r.id} restaurantName={r.name} portal="manager" slug={r.slug} />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
