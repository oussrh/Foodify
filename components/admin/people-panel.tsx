// components/admin/people-panel.tsx
// The People tab of one restaurant, as both portals show it: the managers who can edit it, then
// the devices that work its service — the order tablets on the pass and the waiters on the floor.
// A restaurant runs its own people: a manager adds a colleague by address, sets their password
// and takes them off again. Only the reader's own row carries no controls — losing your own
// access is how a restaurant ends up with nobody who can get in, and your own password is
// Account settings' business.
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { EmptyState, PageHeader } from '@/components/shell/page-header'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import AddManagerDialog from '@/components/admin/add-manager-dialog'
import ManagerRowActions from '@/components/admin/manager-row-actions'
import StaffAccounts from '@/components/admin/staff-accounts'
import { LastSignInCell, PeopleTableHead, VerifiedCell } from '@/components/admin/people-cells'
import { ROLE_LABEL } from '@/lib/roles'

interface PersonRow {
  id: string
  email: string
  username: string | null
  emailVerified: Date | null
  lastLogin: Date | null
  role: string
}

interface PeoplePanelProps {
  restaurant: { id: string; name: string; users: PersonRow[] }
  /** The public origin, for the sign-in address shown beside each kind of device. */
  origin: string
  /** Whoever is reading: their own row keeps its name but loses its remove control. */
  currentUserId: string
  /** A super admin also reaches the platform-wide page of each account; a manager does not. */
  isSuperAdmin: boolean
}

/**
 * One restaurant's People tab, for both portals: the managers who can edit it, then its order
 * tablets and waiters. The reader's own row carries no controls.
 */
export default function PeoplePanel({ restaurant, origin, currentUserId, isSuperAdmin }: PeoplePanelProps) {
  const managers = restaurant.users.filter((u) => u.role === 'RESTAURANT_ADMIN')
  const devicesOf = (role: 'KITCHEN' | 'WAITER') =>
    restaurant.users
      .filter((u) => u.role === role)
      // A device always has one; the fallback is only for a row made before usernames existed.
      .map((u) => ({ id: u.id, username: u.username ?? u.email, lastLogin: u.lastLogin }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="People"
        description={`Who works on ${restaurant.name}: its managers, the order tablets on the pass and the waiters on the floor.`}
        actions={<AddManagerDialog restaurantId={restaurant.id} />}
      />

      {managers.length === 0 ? (
        <EmptyState
          title="No managers yet"
          description="Add a manager so someone can keep this menu up to date."
          action={<AddManagerDialog restaurantId={restaurant.id} />}
        />
      ) : (
        <Table>
          <PeopleTableHead name="Manager" />
          <TableBody>
            {managers.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  {isSuperAdmin ? (
                    <Link href={`/admin/users/${u.id}/edit`} className="font-medium hover:underline">
                      {u.email}
                    </Link>
                  ) : (
                    <span className="font-medium">{u.email}</span>
                  )}
                  {/* The role next to the name, so a reader never has to work out which kind of account this is. */}
                  <Badge variant="secondary" className="ml-2 align-middle">
                    {ROLE_LABEL.RESTAURANT_ADMIN}
                  </Badge>
                  {u.id === currentUserId && (
                    <Badge variant="outline" className="ml-2 align-middle">
                      You
                    </Badge>
                  )}
                </TableCell>
                <VerifiedCell emailVerified={u.emailVerified} />
                <LastSignInCell lastLogin={u.lastLogin} />
                <TableCell className="text-right">
                  {u.id !== currentUserId && (
                    <ManagerRowActions restaurantId={restaurant.id} userId={u.id} email={u.email} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <StaffAccounts restaurantId={restaurant.id} staffRole="KITCHEN" accounts={devicesOf('KITCHEN')} loginUrl={`${origin}/kitchen/login`} />
      <StaffAccounts restaurantId={restaurant.id} staffRole="WAITER" accounts={devicesOf('WAITER')} loginUrl={`${origin}/waiter/login`} />
    </div>
  )
}
