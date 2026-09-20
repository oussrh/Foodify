import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ManagerRowMenu } from '@/components/shell/user-row-menu'

/** A manager row with the restaurants it is assigned to, as the list shows it. */
interface ManagerRow {
  id: string
  email: string
  emailVerified: Date | null
  lastLogin: Date | null
  restaurants: { name: string }[]
}

/** The managers table: who they are, what they manage, whether they verified, when they last signed in. */
export function ManagersTable({ users }: { users: ManagerRow[] }) {
  return (
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
  )
}
