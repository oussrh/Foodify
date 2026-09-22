// components/orders/order-columns.tsx
// The board's three lanes: waiting to be started, being made, and up on the pass. An order moves
// lane when staff press its button, so where a card sits is the state — nothing to read. Each
// lane is its own tray, sunk into the page with its own heading bar and colour, so at a glance
// across a kitchen the two are never one list: side by side on a tablet held landscape, stacked
// with the same trays when the screen is narrow.
'use client'

import { byStatus, type BoardOrder, type OrderStatus } from '@/lib/orders'
import { cn } from '@/lib/utils'
import OrderCard from './order-card'

interface OrderColumnsProps {
  orders: BoardOrder[]
  now: number
  busyId: string | null
  arrived: string[]
  onOpen: (order: BoardOrder) => void
  onAdvance: (order: BoardOrder) => void
}

interface Lane {
  status: Extract<OrderStatus, 'NEW' | 'ACCEPTED' | 'READY'>
  title: string
  empty: string
  /** The bar down the lane's heading: the same colour as the card's own move button. */
  accent: string
}

const LANES: Lane[] = [
  { status: 'NEW', title: 'Waiting', empty: 'Nothing waiting.', accent: 'bg-brand' },
  { status: 'ACCEPTED', title: 'Being made', empty: 'Nothing on yet.', accent: 'bg-warning' },
  // The lane the floor reads: the kitchen is finished and nobody has carried it yet.
  { status: 'READY', title: 'Ready to serve', empty: 'Nothing up.', accent: 'bg-success' },
]

export default function OrderColumns({ orders, now, busyId, arrived, onOpen, onAdvance }: OrderColumnsProps) {
  const lanes = byStatus(orders)

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
      {LANES.map((lane) => {
        const cards = lanes[lane.status]
        return (
          <section
            key={lane.status}
            aria-labelledby={`lane-${lane.status}`}
            className="flex flex-col overflow-hidden rounded-lg border border-border-strong bg-muted/40"
          >
            <h2
              id={`lane-${lane.status}`}
              className="flex items-center gap-2.5 border-b border-border-strong bg-card px-3 py-2.5 text-sm font-semibold uppercase tracking-wide"
            >
              <span className={cn('h-4 w-1.5 shrink-0 rounded-full', lane.accent)} aria-hidden="true" />
              {lane.title}
              <span className="tnum ml-auto rounded-full bg-muted px-2.5 py-0.5 text-sm font-semibold tabular-nums text-foreground">{cards.length}</span>
            </h2>

            <div className="p-3">
              {cards.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">{lane.empty}</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {cards.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      now={now}
                      busy={busyId === order.id}
                      fresh={arrived.includes(order.id)}
                      onOpen={() => onOpen(order)}
                      onAdvance={() => onAdvance(order)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
