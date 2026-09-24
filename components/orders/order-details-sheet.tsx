// components/orders/order-details-sheet.tsx
// One order in full, opened by tapping its card: every line with what the guest asked for, the
// note for the kitchen, the table, the wait and the total, the number to call, and the moves
// staff can make. Cancel lives here rather than on the card, behind a second tap, so a passing
// hand cannot throw an order away.
'use client'

import { useState } from 'react'
import { Phone, X } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { formatPrice, type Money } from '@/lib/menu'
import { cn } from '@/lib/utils'
import { isClosed, itemCount, minutesWaiting, STATUS_LABEL, type BoardOrder, type OrderMove } from '@/lib/orders'
import { additionLabel } from '@/lib/table-tab'
import OrderTimeline from './order-timeline'

interface OrderDetailsSheetProps {
  order: BoardOrder | null
  onClose: () => void
  onAction: (action: OrderMove) => void
  busy: boolean
  money: Money
  now: number
  /** Opened from the history rather than the board: the order is a record, so it offers no moves. */
  readOnly?: boolean
}

/**
 * One order in full: every line and note, the table, the wait, the total, the number to call, and
 * the moves staff can make, with cancel behind a second tap.
 */
export default function OrderDetailsSheet({ order, onClose, onAction, busy, money, now, readOnly = false }: OrderDetailsSheetProps) {
  // Cancel asks twice: the second tap is the answer, and closing the sheet forgets the question.
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const close = () => {
    setConfirmingCancel(false)
    onClose()
  }

  return (
    <Sheet open={order !== null} onOpenChange={(open) => !open && close()}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] w-full max-w-xl overflow-y-auto p-0">
        {order && (
          <div className="px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />

            <SheetTitle className="text-[26px] font-semibold leading-none tracking-display">Table {order.table}</SheetTitle>
            <SheetDescription className="tnum mt-1.5 text-sm">
              {additionLabel(order) && `${additionLabel(order)} · `}#{order.number} · {STATUS_LABEL[order.status]} · {itemCount(order)} items
              {!readOnly && ` · ${minutesWaiting(order.createdAt, now)} min`}
            </SheetDescription>

            {readOnly && <OrderTimeline order={order} />}

            <ul className="mt-4 flex flex-col divide-y divide-border border-y border-border">
              {order.lines.map((line) => (
                <li key={line.id} className="flex items-baseline gap-3 py-3">
                  <span className="tnum min-w-[2.5ch] text-xl font-semibold">{line.quantity}×</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] leading-snug">{line.nameEn}</span>
                    <span className="block text-[13px] text-muted-foreground">{line.nameFr}</span>
                    {line.note && <span className="mt-1 block text-[15px] font-semibold text-warning">{line.note}</span>}
                  </span>
                </li>
              ))}
            </ul>

            {order.note && (
              <p className="mt-3 rounded-md bg-muted px-3 py-2.5 text-[15px]">
                <span className="font-semibold">For the kitchen: </span>
                {order.note}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="tnum text-lg font-semibold">{formatPrice(order.subtotal, money)}</span>
            </div>

            <Button asChild variant="outline" className="mt-4 h-14 w-full text-[15px]">
              <a href={`tel:${order.phone}`}>
                <Phone className="h-4 w-4" />
                <span className="tnum">{order.phone}</span>
              </a>
            </Button>

            <div className={cn('mt-4 flex-col gap-2', readOnly || isClosed(order.status) ? 'hidden' : 'flex')}>
              {order.status === 'NEW' && (
                <Button onClick={() => onAction('accept')} disabled={busy} className="h-16 w-full text-lg">
                  Start
                </Button>
              )}
              <Button onClick={() => onAction('done')} disabled={busy} className="h-16 w-full bg-success text-lg text-white hover:bg-success/90">
                Served
              </Button>
              {confirmingCancel ? (
                <Button onClick={() => onAction('cancel')} disabled={busy} variant="destructive" className="h-14 w-full text-[15px]">
                  Tap again to cancel order #{order.number}
                </Button>
              ) : (
                <Button onClick={() => setConfirmingCancel(true)} disabled={busy} variant="ghost" className="h-14 w-full text-[15px] text-muted-foreground">
                  <X className="h-4 w-4" />
                  Cancel order
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
