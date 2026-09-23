// components/orders/served-list.tsx
// What has already gone out: the orders this restaurant last finished, newest first, so staff
// can check what a table was given without asking the kitchen. A row is a record rather than a
// job — no move button — but it opens the same details sheet, so the lines and the note are one
// tap away. The list is the last hundred, not "today": nothing here depends on where a day is cut.
'use client'

import { Check, ChevronRight, X } from 'lucide-react'
import { formatPrice, type Money } from '@/lib/menu'
import { itemCount, type BoardOrder } from '@/lib/orders'
import { cn } from '@/lib/utils'

interface ServedListProps {
  orders: BoardOrder[]
  onOpen: (order: BoardOrder) => void
  money: Money
}

const TIME: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }

/**
 * The orders this restaurant last finished, newest first, as records without a move; a row opens
 * the details sheet.
 */
export default function ServedList({ orders, onOpen, money }: ServedListProps) {
  return (
    <ul className="overflow-hidden rounded-lg border border-border-strong bg-card">
      {orders.map((order) => {
        const cancelled = order.status === 'CANCELLED'
        return (
          <li key={order.id} className="border-b border-border last:border-b-0">
            <button
              type="button"
              onClick={() => onOpen(order)}
              className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4"
            >
              <span
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                  cancelled ? 'bg-muted text-muted-foreground' : 'bg-success/12 text-success',
                )}
                aria-hidden="true"
              >
                {cancelled ? <X className="h-5 w-5" /> : <Check className="h-5 w-5" />}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-semibold leading-tight">Table {order.table}</span>
                <span className="tnum block truncate text-[13px] text-muted-foreground">
                  #{order.number} · {itemCount(order)} item{itemCount(order) === 1 ? '' : 's'} ·{' '}
                  {cancelled ? 'cancelled' : 'served'} {new Date(order.updatedAt).toLocaleTimeString('en-GB', TIME)}
                </span>
              </span>

              <span className={cn('tnum shrink-0 text-[15px] font-semibold', cancelled && 'text-muted-foreground line-through')}>
                {formatPrice(order.subtotal, money)}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
