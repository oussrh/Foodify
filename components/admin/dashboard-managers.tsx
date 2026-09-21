import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/shell/page-header'

/** A manager row with the restaurants it is assigned to. */
interface RecentManager {
  id: string
  email: string
  lastLogin: Date | null
  restaurants: { name: string }[]
}

/** The overview's recently added managers section. */
export function DashboardManagers({ managers }: { managers: RecentManager[] }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold">Recently added managers</h2>
        <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
          View all
        </Link>
      </div>
      {managers.length === 0 ? (
        <EmptyState title="No managers yet" description="Managers are the people who edit a restaurant's menu." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Manager</TableHead>
              <TableHead>Restaurants</TableHead>
              <TableHead className="hidden sm:table-cell">Last sign-in</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {managers.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <Link href={`/admin/users/${u.id}/edit`} className="font-medium hover:underline">
                    {u.email}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {u.restaurants.length === 0 ? '-' : u.restaurants.map((r) => r.name).join(', ')}
                </TableCell>
                <TableCell className="tnum hidden text-muted-foreground sm:table-cell">
                  {u.lastLogin ? u.lastLogin.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Never'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
