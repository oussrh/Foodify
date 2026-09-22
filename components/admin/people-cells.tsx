// components/admin/people-cells.tsx
// The two cells every list of people repeats: whether the address was verified, and when the
// account last signed in. They live here so the managers list, the restaurant's People tab and
// the dashboard say them the same way and in one place.
import { TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

/**
 * The head every list of people shares: who they are, the two cells below, and a column for the
 * row's controls. `extra` is the one column a list adds of its own, straight after the name.
 */
export function PeopleTableHead({ name, extra }: { name: string; extra?: string }) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>{name}</TableHead>
        {extra && <TableHead>{extra}</TableHead>}
        <TableHead className="hidden sm:table-cell">Verified</TableHead>
        <TableHead className="hidden md:table-cell">Last sign-in</TableHead>
        <TableHead className="w-[1%]">
          <span className="sr-only">Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}

/** Verified or pending; a person's address, never a device's (a device has none). */
export function VerifiedCell({ emailVerified }: { emailVerified: Date | null }) {
  return (
    <TableCell className="hidden sm:table-cell">
      {emailVerified ? (
        <span className="text-xs font-medium text-success">Verified</span>
      ) : (
        <span className="text-xs text-muted-foreground">Pending</span>
      )}
    </TableCell>
  )
}

/** The day of the last sign-in, or "Never" for an account nobody has used yet. */
export function LastSignInCell({ lastLogin }: { lastLogin: Date | null }) {
  return (
    <TableCell className="tnum hidden text-muted-foreground md:table-cell">
      {lastLogin ? lastLogin.toLocaleDateString('en-GB', DAY) : 'Never'}
    </TableCell>
  )
}
