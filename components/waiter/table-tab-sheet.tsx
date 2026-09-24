// components/waiter/table-tab-sheet.tsx
// The table's bill so far, opened from the order screen's header: what was sent when the table
// ordered, each addition since with the time it went in, where each ticket stands with the
// kitchen, and what the whole bill comes to. It answers the guest's "did the wine go through?"
// and the waiter's "what have they already had?" without walking to the pass.
'use client'

import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import OrderLineList from '@/components/orders/order-line-list'
import { formatPrice, type Money } from '@/lib/menu'
import { STATUS_LABEL, type BoardOrder } from '@/lib/orders'
import type { TableTab } from '@/lib/table-tab'
import { cn } from '@/lib/utils'

interface TableTabSheetProps {
  tab: TableTab
  open: boolean
  onOpenChange: (open: boolean) => void
  money: Money
}

const CLOCK: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }

/** One ticket of the bill: when it went in, where it stands, its dishes and what it came to. */
function Ticket({ order, heading, money }: { order: BoardOrder; heading: string; money: Money }) {
  const cancelled = order.status === 'CANCELLED'
  return (
    <li className={cn('rounded-lg border border-border bg-card p-3', cancelled && 'opacity-60')}>
      <div className="flex items-baseline gap-2">
        <span className="text-[15px] font-semibold">{heading}</span>
        <span className="flex-1" />
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">{STATUS_LABEL[order.status]}</span>
      </div>
      <OrderLineList lines={order.lines} />
      {order.note && <p className="pt-2 text-[13px] italic text-muted-foreground">“{order.note}”</p>}
      <p className={cn('tnum pt-2 text-right text-[13px] text-muted-foreground', cancelled && 'line-through')}>{formatPrice(order.subtotal, money)}</p>
    </li>
  )
}

/**
 * The table's bill so far: the first order, every addition with the time it was sent, each
 * ticket's status and the total, cancelled tickets shown but not counted.
 */
export function TableTabSheet({ tab, open, onOpenChange, money }: TableTabSheetProps) {
  const at = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', CLOCK)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto p-0 sm:rounded-t-sheet">
        <div className="px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <SheetTitle className="text-lg font-semibold">
            Table {tab.parent.table} · Order #{tab.parent.number}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">Everything this table has ordered, and where it stands.</SheetDescription>

          <ul className="mt-3 flex flex-col gap-3">
            <Ticket order={tab.parent} heading={`Ordered ${at(tab.parent.createdAt)}`} money={money} />
            {tab.additions.map((addition) => (
              <Ticket key={addition.id} order={addition} heading={`Added ${at(addition.createdAt)}`} money={money} />
            ))}
          </ul>

          <div className="tnum mt-4 flex items-center justify-between border-t border-border pt-3 text-[17px] font-semibold">
            <span>Total</span>
            <span>{formatPrice(tab.total, money)}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
