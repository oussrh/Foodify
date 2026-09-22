// components/waiter/waiter-orders.tsx
// Every order on the floor as one list, which the table grid cannot show: the grid answers "what
// is happening at table 6" and this answers "what is happening at all", which is the question a
// waiter asks when they walk back in and want to know where to go first.
//
// Ready first and then oldest first, because both are the same instruction — deal with this one
// next. Carrying one out takes it off the list, which is the only move the floor owns; the
// portal's Orders tab is where the history lives.
'use client'

import { useCallback, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { setOrderStatus } from '@/app/actions/order-actions'
import { Button } from '@/components/ui/button'
import OrderLineList from '@/components/orders/order-line-list'
import { useMinuteClock } from '@/components/orders/use-minute-clock'
import { useOrderBoard } from '@/components/orders/use-order-board'
import { itemCount, minutesWaiting, STATUS_LABEL, type BoardOrder } from '@/lib/orders'
import { readyOrders } from '@/lib/waiter-floor'
import { cn } from '@/lib/utils'
import { WaiterHeader } from './waiter-header'
import { WaiterNav } from './waiter-nav'

/** A waiter placed these; nothing here should announce them a second time. */
const silent = () => undefined

function OrderCard({ order, now, ready, onDeliver, busy }: { order: BoardOrder; now: number; ready: boolean; onDeliver: () => void; busy: boolean }) {
  const waiting = minutesWaiting(order.createdAt, now)
  const items = itemCount(order)

  return (
    <li className={cn('rounded-lg border-2 p-3', ready ? 'border-success bg-success/10' : 'border-border bg-card')}>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold leading-none tracking-display">{order.table}</span>
        <span className="text-xs text-muted-foreground">Table</span>
        <span className="flex-1" />
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', ready ? 'bg-success text-white' : 'bg-muted text-foreground')}>
          {ready ? 'Ready' : STATUS_LABEL[order.status]}
        </span>
      </div>

      <p className="tnum pt-1 text-[13px] text-muted-foreground">
        #{order.number} · {items} item{items === 1 ? '' : 's'} · {waiting} min
        {order.placedBy ? ' · taken at the table' : ''}
      </p>

      <OrderLineList lines={order.lines} />

      {order.note && <p className="pt-2 text-[13px] italic text-muted-foreground">“{order.note}”</p>}

      {/* The floor's one move: it was carried to the table. Only on a ready order, because
          nothing else is a waiter's to close. */}
      {ready && (
        <Button className="mt-3 h-14 w-full text-[15px]" disabled={busy} onClick={onDeliver}>
          {busy ? 'Saving…' : `Carried to table ${order.table}`}
        </Button>
      )}
    </li>
  )
}

export function WaiterOrders({ restaurant }: { restaurant: { id: string; code: string; name: string } }) {
  const now = useMinuteClock()
  const open = useOrderBoard(restaurant.id, 'open', silent)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const readyIds = new Set(readyOrders(open.orders).map((order) => order.id))
  // One list, sorted: ready first, then whatever has waited longest. Both mean "this one next".
  const all = [...open.orders].sort((a, b) => {
    if (readyIds.has(a.id) !== readyIds.has(b.id)) return readyIds.has(a.id) ? -1 : 1
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const refresh = useCallback(() => open.refresh(), [open])

  const deliver = (orderId: string) => {
    setBusyId(orderId)
    startTransition(async () => {
      try {
        await setOrderStatus({ orderId, action: 'done' })
        open.refresh()
      } catch {
        toast.error('Could not mark that one carried out.')
      } finally {
        setBusyId(null)
      }
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <WaiterHeader
          title="Orders"
          restaurantName={restaurant.name}
          online={open.online}
          loading={open.loading}
          onRefresh={refresh}
        />
      </header>

      <main className="flex-1 px-3 pb-28 pt-4">
        {all.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            {open.loading ? 'Asking the kitchen…' : 'Nothing with the kitchen right now.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {all.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                now={now}
                ready={readyIds.has(order.id)}
                busy={busyId === order.id}
                onDeliver={() => deliver(order.id)}
              />
            ))}
          </ul>
        )}
      </main>

      <WaiterNav restaurantId={restaurant.code} active="orders" />
    </div>
  )
}
