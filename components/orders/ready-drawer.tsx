// components/orders/ready-drawer.tsx
// What is up on the pass, behind a handle on the right rather than in a lane of its own. It is
// the floor's work, not the kitchen's: a lane for it would take a third of the board away from
// the two things the kitchen is actually doing, and the pass does not need it on screen to keep
// cooking — it needs it when it wants to know what is still sitting there.
//
// The handle carries the count, so the one fact that matters is on the board without the list
// being. An order leaves this drawer when a waiter says they carried it out.
'use client'

import { Bell } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { itemCount, minutesWaiting, type BoardOrder } from '@/lib/orders'
import OrderLineList from './order-line-list'
import { cn } from '@/lib/utils'

interface ReadyDrawerProps {
  orders: BoardOrder[]
  now: number
  /** Marks one carried out; the kitchen can close its own ticket when it hands over directly. */
  onDeliver: (order: BoardOrder) => void
  busyId: string | null
}

/**
 * What is up on the pass, behind a handle carrying the count; an order leaves it when a waiter says
 * they carried it out.
 */
export default function ReadyDrawer({ orders, now, onDeliver, busyId }: ReadyDrawerProps) {
  const count = orders.length

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`${count} order${count === 1 ? '' : 's'} ready to serve`}
          className={cn(
            'inline-flex h-12 min-w-12 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors',
            count > 0 ? 'border-transparent bg-success text-white' : 'border-border-strong bg-card text-muted-foreground',
          )}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span className="tnum">{count}</span>
          <span className="hidden md:inline">Ready</span>
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetTitle className="text-lg font-semibold">Ready to serve</SheetTitle>
        <SheetDescription className="text-sm text-muted-foreground">
          Up on the pass and waiting for the floor. The waiter&apos;s phone was told the moment each one was called up.
        </SheetDescription>

        {count === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Nothing up right now.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {orders.map((order) => (
              <li key={order.id} className="rounded-lg border-2 border-success bg-card p-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold leading-none tracking-display">Table {order.table}</span>
                  <span className="flex-1" />
                  <span className="tnum text-sm text-muted-foreground">{minutesWaiting(order.readyAt ?? order.createdAt, now)} min up</span>
                </div>
                <p className="tnum pt-1 text-[13px] text-muted-foreground">
                  #{order.number} · {itemCount(order)} item{itemCount(order) === 1 ? '' : 's'}
                </p>
                <OrderLineList lines={order.lines} />
                <button
                  type="button"
                  disabled={busyId === order.id}
                  onClick={() => onDeliver(order)}
                  className="mt-3 h-14 w-full rounded-md bg-success text-[15px] font-semibold text-white disabled:opacity-60"
                >
                  {busyId === order.id ? 'Saving…' : 'Carried out'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  )
}
