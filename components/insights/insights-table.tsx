// components/insights/insights-table.tsx
// The report bucket by bucket, newest first — the way someone reads a report, starting with
// what just happened. An empty bucket is a row of zeros rather than a missing line: a quiet
// Tuesday is a finding. The cart column is dropped for a restaurant that takes no orders; it
// would be a column of zeros saying nothing but "this is off".
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { bucketLabel, formatDuration, type Grain, type InsightsBucket } from '@/lib/insights'

interface InsightsTableProps {
  buckets: InsightsBucket[]
  grain: Grain
  ordering: boolean
}

export function InsightsTable({ buckets, grain, ordering }: InsightsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Period</TableHead>
          <TableHead className="text-right">Views</TableHead>
          <TableHead className="hidden text-right sm:table-cell">AR</TableHead>
          {ordering && <TableHead className="text-right">In cart</TableHead>}
          {ordering && <TableHead className="text-right">Guest orders</TableHead>}
          {ordering && <TableHead className="text-right">Waiter orders</TableHead>}
          {ordering && <TableHead className="hidden text-right md:table-cell">To accept</TableHead>}
          {ordering && <TableHead className="hidden text-right md:table-cell">To serve</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...buckets].reverse().map((bucket) => (
          <TableRow key={bucket.start.toISOString()}>
            <TableCell className="whitespace-nowrap font-medium">{bucketLabel(bucket.start, grain)}</TableCell>
            <TableCell className="tnum text-right">{bucket.views.toLocaleString()}</TableCell>
            <TableCell className="tnum hidden text-right text-muted-foreground sm:table-cell">
              {bucket.arViews.toLocaleString()}
            </TableCell>
            {ordering && <TableCell className="tnum text-right">{bucket.cartAdds.toLocaleString()}</TableCell>}
            {ordering && <TableCell className="tnum text-right">{bucket.guestOrders.toLocaleString()}</TableCell>}
            {ordering && <TableCell className="tnum text-right">{bucket.staffOrders.toLocaleString()}</TableCell>}
            {ordering && (
              <TableCell className="tnum hidden text-right text-muted-foreground md:table-cell">
                {formatDuration(bucket.acceptSeconds)}
              </TableCell>
            )}
            {ordering && (
              <TableCell className="tnum hidden text-right text-muted-foreground md:table-cell">
                {formatDuration(bucket.serveSeconds)}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
