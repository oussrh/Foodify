import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/shell/page-header'
import { RestaurantRowMenu } from '@/components/shell/row-actions'

/** A restaurant row with the counts the overview shows beside it. */
interface DashboardRestaurant {
  id: string
  name: string
  slug: string
  city: string | null
  createdAt: Date
  _count: { dishes: number; categories: number; users: number }
}

/** The overview's restaurants section: the newest eight, or the invitation to create the first. */
export function DashboardRestaurants({ restaurants }: { restaurants: DashboardRestaurant[] }) {
  return (
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
                <TableCell className="hidden text-muted-foreground sm:table-cell">{r.city || '-'}</TableCell>
                <TableCell className="tnum">
                  {r._count.dishes}
                  <span className="text-muted-foreground"> · {r._count.categories} cat.</span>
                </TableCell>
                <TableCell className="tnum hidden md:table-cell">{r._count.users}</TableCell>
                <TableCell className="tnum hidden text-muted-foreground lg:table-cell">
                  {r.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </TableCell>
                <TableCell className="text-right">
                  <RestaurantRowMenu restaurantId={r.id} restaurantName={r.name} portal="admin" slug={r.slug} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
