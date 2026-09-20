import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ResetAdminPasswordButton from '@/components/reset-admin-password-button'

/** An administrator row as the list shows it. */
interface AdminRow {
  id: string
  email: string
  totpSecret: string | null
  lastLogin: Date | null
  createdAt: Date
}

/** The administrators table; `meEmail` marks the signed-in admin's own row. */
export function AdminsTable({ admins, meEmail }: { admins: AdminRow[]; meEmail: string }) {
  return (
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
              {meEmail === a.email && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
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
  )
}
