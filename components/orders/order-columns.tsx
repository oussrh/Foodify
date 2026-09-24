// components/orders/order-columns.tsx
// The board's two lanes: waiting to be started, and being made. An order moves
// lane when staff press its button, so where a card sits is the state — nothing to read. Each
// lane is its own tray, sunk into the page with its own heading bar and colour, so at a glance
// across a kitchen the two are never one list: side by side on a tablet held landscape, stacked
// with the same trays when the screen is narrow.
'use client'

import { byStatus, type BoardOrder, type OrderStatus, type PendingRequest } from '@/lib/orders'
import { cn } from '@/lib/utils'
import OrderCard from './order-card'

interface OrderColumnsProps {
  orders: BoardOrder[]
  now: number
  busyId: string | null
  arrived: string[]
  onOpen: (order: BoardOrder) => void
  onAdvance: (order: BoardOrder) => void
  onDecide: (request: PendingRequest, accept: boolean) => void
}

interface Lane {
  status: Extract<OrderStatus, 'NEW' | 'ACCEPTED'>
  title: string
  empty: string
  /** The bar down the lane's heading: the same colour as the card's own move button. */
  accent: string
}

const LANES: Lane[] = [
  { status: 'NEW', title: 'Waiting', empty: 'Nothing waiting.', accent: 'bg-brand' },
  { status: 'ACCEPTED', title: 'Being made', empty: 'Nothing on yet.', accent: 'bg-warning' },
  // What is up on the pass is not a third lane: it is the floor's work, not the kitchen's, and a
  // lane for it takes a third of a board from the two things the kitchen is actually doing. It
  // lives in a drawer the pass can pull out when it wants to see what is waiting to go.
]

/** The board's two lanes, waiting to be started and being made, so where a card sits is its state. */
export default function OrderColumns({ orders, now, busyId, arrived, onOpen, onAdvance, onDecide }: OrderColumnsProps) {
  const lanes = byStatus(orders)

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
      {LANES.map((lane) => {
        const cards = lanes[lane.status]
        const asking = cards.filter((order) => order.requests.length > 0).length
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
              {asking > 0 && (
                <span className="ml-auto rounded-full bg-warning px-2.5 py-0.5 text-sm font-semibold normal-case tracking-normal text-white">
                  {asking} asking
                </span>
              )}
              <span className={cn('tnum rounded-full bg-muted px-2.5 py-0.5 text-sm font-semibold tabular-nums text-foreground', asking === 0 && 'ml-auto')}>{cards.length}</span>
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
                      onDecide={onDecide}
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
