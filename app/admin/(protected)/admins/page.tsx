import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, PageHeader } from '@/components/shell/page-header'
import { ListSearch } from '@/components/shell/list-search'
import { AdminsTable } from '@/components/admin/admins-table'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export default async function AdminsPage({ searchParams }: { searchParams?: Promise<{ search?: string }> }) {
  const me = await requireSuperAdminPage()
  const sp = searchParams ? await searchParams : undefined
  const search = (sp?.search || '').trim()

  const rows = await prisma.user.findMany({
    where: {
      role: 'SUPER_ADMIN',
      ...(search ? { email: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, emailVerified: true, totpSecret: true, lastLogin: true, createdAt: true },
  })
  // the secret stays here: the table only learns which second factor is set
  const admins = rows.map(({ totpSecret, ...a }) => ({ ...a, usesAuthenticator: Boolean(totpSecret) }))

  return (
    <div className="flex flex-col gap-2">
      <PageHeader
        title="Admins"
        description="Accounts with access to every restaurant on the platform."
        actions={
          <Button asChild>
            <Link href="/admin/admins/create">
              <Plus className="h-4 w-4" />
              Add admin
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <ListSearch value={search} placeholder="Search by email" label="Search admins" />

        {admins.length === 0 ? (
          <EmptyState
            title={search ? `Nothing matches “${search}”` : 'No admins'}
            action={
              search ? (
                <Link href="/admin/admins" className="text-sm font-medium text-primary hover:underline">
                  Clear search
                </Link>
              ) : undefined
            }
          />
        ) : (
          <AdminsTable admins={admins} meEmail={me.email} />
        )}
      </div>
    </div>
  )
}
