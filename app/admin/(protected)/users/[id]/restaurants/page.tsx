import Link from 'next/link'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState, PageHeader } from '@/components/shell/page-header'
import AssignRestaurantsDialog from '@/components/assign-restaurants-dialog'
import RemoveUserRestaurantButton from '@/components/remove-user-restaurant-button'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export default async function UserRestaurantsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdminPage()
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      restaurants: {
        select: { id: true, name: true, slug: true, city: true, _count: { select: { dishes: true } } },
        orderBy: { name: 'asc' },
      },
    },
  })
  if (!user) redirect('/admin/users')

  const restaurantIds = user.restaurants.map((r) => r.id)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Restaurants"
        description={`What ${user.email} can manage.`}
        back={{ href: '/admin/users', label: 'All managers' }}
        actions={<AssignRestaurantsDialog userId={user.id} defaultRestaurantIds={restaurantIds} />}
      />

      {user.restaurants.length === 0 ? (
        <EmptyState
          title="No restaurants assigned"
          description="This manager cannot edit anything until they are assigned to a restaurant."
          action={<AssignRestaurantsDialog userId={user.id} defaultRestaurantIds={restaurantIds} />}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant</TableHead>
              <TableHead className="hidden sm:table-cell">City</TableHead>
              <TableHead>Dishes</TableHead>
              <TableHead className="w-[1%]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user.restaurants.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link href={`/admin/restaurants/${r.id}/menu`} className="font-medium hover:underline">
                    {r.name}
                  </Link>
                  <span className="block text-xs text-muted-foreground">/{r.slug}</span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{r.city || '—'}</TableCell>
                <TableCell className="tnum">{r._count.dishes}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex h-8 items-center rounded-md px-2 text-sm text-muted-foreground hover:bg-accent hover:text-destructive">
                    <RemoveUserRestaurantButton userId={user.id} restaurantIds={restaurantIds} restaurantId={r.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
