// components/orders/order-details-sheet.tsx
// One order in full, opened by tapping its card: every line with what the guest asked for and
// what came off it since, the floor's requests waiting on the kitchen, the note, the table, the
// wait and the total, the number to call, and the moves staff can make. Cancel lives here rather
// than on the card, behind a second tap, so a passing hand cannot throw an order away. A manager
// also voids a dish or the whole ticket here, and reads the order's change log.
'use client'

import { useState } from 'react'
import { Phone, X } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { formatPrice, type Money } from '@/lib/menu'
import { cn } from '@/lib/utils'
import { isClosed, itemCount, minutesWaiting, STATUS_LABEL, type BoardLine, type BoardOrder, type OrderMove, type PendingRequest } from '@/lib/orders'
import { voidable } from '@/lib/bill-rules'
import { additionLabel } from '@/lib/table-tab'
import ChangeLogList from './change-log-list'
import DetailsLines from './details-lines'
import OrderTimeline from './order-timeline'
import { RequestBanner } from './request-banner'
import VoidPanel from './void-panel'

interface OrderDetailsSheetProps {
  order: BoardOrder | null
  onClose: () => void
  onAction: (action: OrderMove) => void
  busy: boolean
  money: Money
  now: number
  /** Opened from the history rather than the board: the order is a record, so it offers no moves. */
  readOnly?: boolean
  /** Answers a request from the floor; absent where requests are not answered (the history). */
  onDecide?: ((request: PendingRequest, accept: boolean) => void) | undefined
  /** The signed-in user is a manager: voids and the change log are offered, and `onChanged` reads the order again after one. */
  manager?: { onChanged: () => void } | undefined
}

/** What is being voided: one line, or the whole ticket. */
type Voiding = { line: BoardLine | null } | null

/** The board's moves on an order still being worked: start, served, and cancel behind a second tap. */
function BoardMoves({ order, onAction, busy }: { order: BoardOrder; onAction: (action: OrderMove) => void; busy: boolean }) {
  // Cancel asks twice: the second tap is the answer, and closing the sheet forgets the question.
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  return (
    <div className="mt-4 flex flex-col gap-2">
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
  )
}

/** What the sheet shows of an order when nothing is being voided: requests, lines, note, total, phone, moves, and a manager's void and log. */
function DetailsBody(props: {
  order: BoardOrder
  money: Money
  busy: boolean
  readOnly: boolean
  onAction: (action: OrderMove) => void
  onDecide: OrderDetailsSheetProps['onDecide']
  manager: boolean
  onVoid: (line: BoardLine | null) => void
  version: number
}) {
  const { order, money, busy, readOnly, onAction, onDecide, manager, onVoid, version } = props
  // Once it is ready or served, and only then: before that a manager cancels or removes like the floor.
  const canVoid = manager && voidable(order.status)
  return (
    <>
      {onDecide && (
        <div className="mt-4 overflow-hidden rounded-lg">
          <RequestBanner order={order} onDecide={onDecide} busy={busy} />
        </div>
      )}
      {readOnly && <OrderTimeline order={order} />}

      <DetailsLines lines={order.lines} onVoid={canVoid ? (line) => onVoid(line) : undefined} />

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

      <Button asChild variant="outline" className={cn('mt-4 h-14 w-full text-[15px]', order.phone === '' && 'hidden')}>
        <a href={`tel:${order.phone}`}>
          <Phone className="h-4 w-4" />
          <span className="tnum">{order.phone}</span>
        </a>
      </Button>

      {!readOnly && !isClosed(order.status) && <BoardMoves key={order.id} order={order} onAction={onAction} busy={busy} />}

      {canVoid && (
        <Button variant="outline" className="mt-2 h-14 w-full text-[15px] text-destructive" onClick={() => onVoid(null)}>
          Void the whole order
        </Button>
      )}
      {manager && <ChangeLogList orderId={order.id} version={version} />}
    </>
  )
}

/**
 * One order in full: every line and note, what came off it, the floor's requests, the table, the
 * wait, the total, the number to call, and the moves staff can make; a manager's voids and change log.
 */
export default function OrderDetailsSheet(props: OrderDetailsSheetProps) {
  const { order, onClose, onAction, busy, money, now, onDecide, manager } = props
  const readOnly = props.readOnly === true
  const [voiding, setVoiding] = useState<Voiding>(null)
  // Moves on every void made from the sheet, so the change log reads itself again.
  const [version, setVersion] = useState(0)
  const close = () => {
    setVoiding(null)
    onClose()
  }
  const voided = () => {
    setVoiding(null)
    setVersion((v) => v + 1)
    manager?.onChanged()
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

            {voiding ? (
              <div className="mt-4">
                <VoidPanel order={order} line={voiding.line} onDone={voided} onBack={() => setVoiding(null)} />
              </div>
            ) : (
              <DetailsBody
                order={order}
                money={money}
                busy={busy}
                readOnly={readOnly}
                onAction={onAction}
                onDecide={onDecide}
                manager={manager !== undefined}
                onVoid={(line) => setVoiding({ line })}
                version={version}
              />
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
