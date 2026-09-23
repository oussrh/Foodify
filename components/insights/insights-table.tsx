// components/insights/insights-table.tsx
// The report bucket by bucket, newest first — the way someone reads a report, starting with
// what just happened — and the text alternative to every chart above it. An empty bucket is a row
// of zeros rather than a missing line: a quiet Tuesday is a finding. The order columns are
// dropped for a restaurant that takes no orders; they would say nothing but "this is off".
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { bucketLabel, formatDuration, type Grain, type InsightsBucket } from '@/lib/insights'
import { formatMinor } from '@/lib/insights-scores'
import type { Money } from '@/lib/menu'
import { cn } from '@/lib/utils'

interface Column {
  head: string
  cell: (bucket: InsightsBucket) => string
  /** Hidden below this width, where the table would scroll sideways. */
  from?: 'sm' | 'md' | 'lg'
  quiet?: boolean
  ordering?: boolean
}

// Spelled out rather than built from `from`, so Tailwind sees each class.
const SHOWN_FROM = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' } as const

const count = (n: number) => n.toLocaleString()

function columnsOf(money: Money): Column[] {
  return [
    { head: 'Views', cell: (b) => count(b.views) },
    { head: 'AR', cell: (b) => count(b.arViews), from: 'sm', quiet: true },
    { head: 'In cart', cell: (b) => count(b.cartAdds), ordering: true },
    { head: 'Guest orders', cell: (b) => count(b.guestOrders), ordering: true },
    { head: 'Waiter orders', cell: (b) => count(b.staffOrders), ordering: true },
    { head: 'Revenue', cell: (b) => formatMinor(b.revenueMinor, money), ordering: true },
    { head: 'Cancelled', cell: (b) => count(b.cancelledOrders), from: 'lg', quiet: true, ordering: true },
    { head: 'To accept', cell: (b) => formatDuration(b.acceptSeconds), from: 'md', quiet: true, ordering: true },
    { head: 'To prepare', cell: (b) => formatDuration(b.prepSeconds), from: 'md', quiet: true, ordering: true },
    { head: 'To serve', cell: (b) => formatDuration(b.serveSeconds), from: 'md', quiet: true, ordering: true },
  ]
}

interface InsightsTableProps {
  buckets: InsightsBucket[]
  grain: Grain
  ordering: boolean
  money: Money
}

/**
 * Every figure bucket by bucket, newest first, as a table; the order columns are left out for a
 * restaurant that takes no orders.
 */
export function InsightsTable({ buckets, grain, ordering, money }: InsightsTableProps) {
  const columns = columnsOf(money).filter((column) => ordering || !column.ordering)
  const shown = (column: Column) => (column.from ? SHOWN_FROM[column.from] : undefined)
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Period</TableHead>
          {columns.map((column) => (
            <TableHead key={column.head} className={cn('text-right', shown(column))}>
              {column.head}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...buckets].reverse().map((bucket) => (
          <TableRow key={bucket.start.toISOString()}>
            <TableCell className="whitespace-nowrap font-medium">{bucketLabel(bucket.start, grain)}</TableCell>
            {columns.map((column) => (
              <TableCell
                key={column.head}
                className={cn('tnum whitespace-nowrap text-right', column.quiet && 'text-muted-foreground', shown(column))}
              >
                {column.cell(bucket)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
