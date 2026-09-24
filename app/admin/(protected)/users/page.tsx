// PathFile: app/admin/(protected)/users/page.tsx
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, PageHeader } from '@/components/shell/page-header'
import { ListSearch } from '@/components/shell/list-search'
import { ManagersTable } from '@/components/admin/managers-table'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { listSearch, type SearchParams } from '@/lib/schemas/page-params'

export default async function UsersPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  await requireSuperAdminPage()
  const search = listSearch.parse((await searchParams)?.search)

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
        <ListSearch value={search} placeholder="Search by email or restaurant" label="Search managers" />

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
          <ManagersTable users={users} />
        )}
      </div>
    </div>
  )
}
