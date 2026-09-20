// PathFile: app/admin/(protected)/users/page.tsx
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState, PageHeader } from '@/components/shell/page-header'
import { ManagerRowMenu } from '@/components/shell/user-row-menu'

export default async function UsersPage({ searchParams }: { searchParams?: Promise<{ search?: string }> }) {
  const sp = searchParams ? await searchParams : undefined
  const search = (sp?.search || '').trim()

  const users = await prisma.user.findMany({
    where: {
      role: 'RESTAURANT_ADMIN',
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { restaurants: { some: { name: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    },
    include: { restaurants: { select: { id: true, name: true }, orderBy: { name: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="flex flex-col gap-2">
      <PageHeader
        title="Managers"
        description="People who can edit a restaurant's menu and settings."
        actions={
          <Button asChild>
            <Link href="/admin/users/create">
              <Plus className="h-4 w-4" />
              Add manager
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <form method="get" className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search by email or restaurant"
            aria-label="Search managers"
            className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>

        {users.length === 0 ? (
          <EmptyState
            title={search ? `Nothing matches “${search}”` : 'No managers yet'}
            description={search ? undefined : 'Add a manager and assign them to a restaurant.'}
            action={
              search ? (
                <Link href="/admin/users" className="text-sm font-medium text-primary hover:underline">
                  Clear search
                </Link>
              ) : (
                <Button asChild>
                  <Link href="/admin/users/create">Add manager</Link>
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Manager</TableHead>
                <TableHead>Restaurants</TableHead>
                <TableHead className="hidden sm:table-cell">Verified</TableHead>
                <TableHead className="hidden md:table-cell">Last sign-in</TableHead>
                <TableHead className="w-[1%]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Link href={`/admin/users/${u.id}/edit`} className="font-medium hover:underline">
                      {u.email}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.restaurants.length === 0 ? (
                      <Link href={`/admin/users/${u.id}/restaurants`} className="text-primary hover:underline">
                        Assign a restaurant
                      </Link>
                    ) : (
                      u.restaurants.map((r) => r.name).join(', ')
                    )}
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
                  <TableCell className="text-right">
                    <ManagerRowMenu userId={u.id} email={u.email} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
