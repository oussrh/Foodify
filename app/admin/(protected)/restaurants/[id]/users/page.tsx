// PathFile: app/admin/(protected)/restaurants/[id]/users/page.tsx
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState, PageHeader } from '@/components/shell/page-header'
import AssignUsersDialog from '@/components/assign-users-dialog'
import RemoveRestaurantUserButton from '@/components/remove-restaurant-user-button'

export default async function RestaurantUsersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      users: {
        where: { role: 'RESTAURANT_ADMIN' },
        select: { id: true, email: true, emailVerified: true, lastLogin: true, createdAt: true },
        orderBy: { email: 'asc' },
      },
    },
  })
  if (!restaurant) redirect('/admin/restaurants')

  const userIds = restaurant.users.map((u) => u.id)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="People"
        description={`Managers who can edit ${restaurant.name}.`}
        actions={<AssignUsersDialog restaurantId={restaurant.id} defaultUserIds={userIds} />}
      />

      {restaurant.users.length === 0 ? (
        <EmptyState
          title="No managers yet"
          description="Assign a manager so someone can keep this menu up to date."
          action={<AssignUsersDialog restaurantId={restaurant.id} defaultUserIds={userIds} />}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Manager</TableHead>
              <TableHead className="hidden sm:table-cell">Verified</TableHead>
              <TableHead className="hidden md:table-cell">Last sign-in</TableHead>
              <TableHead className="hidden lg:table-cell">Added</TableHead>
              <TableHead className="w-[1%]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {restaurant.users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <Link href={`/admin/users/${u.id}/edit`} className="font-medium hover:underline">
                    {u.email}
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {u.emailVerified ? (
                    <span className="text-xs font-medium text-success">Verified</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pending</span>
                  )}
                </TableCell>
                <TableCell className="tnum hidden text-muted-foreground md:table-cell">
                  {u.lastLogin ? u.lastLogin.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                </TableCell>
                <TableCell className="tnum hidden text-muted-foreground lg:table-cell">
                  {u.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex h-8 items-center rounded-md px-2 text-sm text-muted-foreground hover:bg-accent hover:text-destructive">
                    <RemoveRestaurantUserButton restaurantId={restaurant.id} userIds={userIds} userId={u.id} />
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
