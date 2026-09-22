import Link from 'next/link'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { ManagerRowMenu } from '@/components/shell/user-row-menu'
import { LastSignInCell, PeopleTableHead, VerifiedCell } from '@/components/admin/people-cells'

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
      <PeopleTableHead name="Manager" extra="Restaurants" />
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
            <VerifiedCell emailVerified={u.emailVerified} />
            <LastSignInCell lastLogin={u.lastLogin} />
            <TableCell className="text-right">
              <ManagerRowMenu userId={u.id} email={u.email} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
