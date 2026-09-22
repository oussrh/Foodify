// components/orders/order-timeline.tsx
// When an order happened, as three moments and the waits between them: placed, taken on, served.
// It answers the two questions a history is read for — how long the table waited before the
// kitchen started, and how long the food took — without anyone doing arithmetic on timestamps.
import { orderTimings, type BoardOrder } from '@/lib/orders'

const CLOCK: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }

/** One moment of the order, with the gap since the one before it; a stage that has not happened reads as a dash. */
function Moment({ label, at, after }: { label: string; at: string | null; after?: number | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="tnum text-sm font-medium">
        {at ? new Date(at).toLocaleTimeString('en-GB', CLOCK) : '—'}
        {after !== undefined && after !== null && <span className="ml-2 text-muted-foreground">+{after} min</span>}
      </span>
    </div>
  )
}

export default function OrderTimeline({ order }: { order: BoardOrder }) {
  const timings = orderTimings(order)
  return (
    <div className="mt-3 rounded-md border border-border px-3 py-1.5">
      <Moment label="Placed" at={order.createdAt} />
      <Moment label="Taken on" at={order.acceptedAt} after={timings.toStart} />
      <Moment label="Served" at={order.servedAt} after={timings.toServe} />
      {timings.total !== null && (
        <div className="flex items-baseline justify-between gap-3 border-t border-border py-1.5">
          <span className="text-sm font-semibold">Table waited</span>
          <span className="tnum text-sm font-semibold">{timings.total} min</span>
        </div>
      )}
    </div>
  )
}
