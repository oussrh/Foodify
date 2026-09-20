import Link from 'next/link'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState, PageHeader } from '@/components/shell/page-header'
import ResetAdminPasswordButton from '@/components/reset-admin-password-button'

export default async function AdminsPage({ searchParams }: { searchParams?: Promise<{ search?: string }> }) {
  const sp = searchParams ? await searchParams : undefined
  const search = (sp?.search || '').trim()
  const session = await auth()

  const admins = await prisma.user.findMany({
    where: {
      role: 'SUPER_ADMIN',
      ...(search ? { email: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, emailVerified: true, totpSecret: true, lastLogin: true, createdAt: true },
  })

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
        <form method="get" className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search by email"
            aria-label="Search admins"
            className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead className="hidden sm:table-cell">Two-factor</TableHead>
                <TableHead className="hidden md:table-cell">Last sign-in</TableHead>
                <TableHead className="hidden lg:table-cell">Added</TableHead>
                <TableHead className="w-[1%]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link href={`/admin/admins/${a.id}/edit`} className="font-medium hover:underline">
                      {a.email}
                    </Link>
                    {session?.user?.email === a.email && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-xs text-muted-foreground">{a.totpSecret ? 'Authenticator app' : 'Email code'}</span>
                  </TableCell>
                  <TableCell className="tnum hidden text-muted-foreground md:table-cell">
                    {a.lastLogin ? a.lastLogin.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                  </TableCell>
                  <TableCell className="tnum hidden text-muted-foreground lg:table-cell">
                    {a.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/admin/admins/${a.id}/edit`}>Edit</Link>
                      </Button>
                      <ResetAdminPasswordButton id={a.id} className="flex-1" />
                    </div>
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
