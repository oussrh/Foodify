// components/orders/order-card.tsx
// One order on the board, made for a thumb at arm's length: the table big enough to read across
// a kitchen, the wait coloured so it is seen before it is read, the dishes as a short list, and
// one large button that moves it on. The card itself is the way into the details — everything
// else (cancel, the phone, the full list) lives there, so nothing destructive sits under a
// passing hand.
'use client'

import { ChevronRight, Clock } from 'lucide-react'
import { itemCount, minutesWaiting, waitingTier, type BoardOrder } from '@/lib/orders'
import { cn } from '@/lib/utils'

interface OrderCardProps {
  order: BoardOrder
  /** Recomputed by the board every half minute, so the waits tick without each card holding a timer. */
  now: number
  onOpen: () => void
  onAdvance: () => void
  busy: boolean
  /** Arrived on the last poll: the card is ringed until it has been looked at. */
  fresh: boolean
}

const WAIT_STYLE = {
  fresh: 'text-muted-foreground',
  warning: 'text-warning',
  late: 'text-destructive',
} as const

/** How many lines the card lists before it says "and n more"; past this it stops being glanceable. */
const PREVIEW_LINES = 3

export default function OrderCard({ order, now, onOpen, onAdvance, busy, fresh }: OrderCardProps) {
  const waiting = minutesWaiting(order.createdAt, now)
  const tier = waitingTier(waiting)
  const items = itemCount(order)
  const preview = order.lines.slice(0, PREVIEW_LINES)
  const hidden = order.lines.length - preview.length

  return (
    <article className={cn('flex flex-col overflow-hidden rounded-lg border-2 bg-card', fresh ? 'border-brand' : 'border-border')}>
      {/* The whole card opens the order: one big target rather than a small "details" link. */}
      <button type="button" onClick={onOpen} className="flex flex-col gap-3 p-4 text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[28px] font-semibold leading-none tracking-display">Table {order.table}</p>
            <p className="tnum mt-1.5 text-sm text-muted-foreground">
              #{order.number} · {items} item{items === 1 ? '' : 's'}
            </p>
          </div>
          <p className={cn('tnum inline-flex shrink-0 items-center gap-1.5 text-lg font-semibold', WAIT_STYLE[tier])}>
            <Clock className="h-4 w-4" aria-hidden="true" />
            {waiting === 0 ? 'now' : `${waiting}m`}
          </p>
        </header>

        <ul className="flex flex-col gap-1.5">
          {preview.map((line) => (
            <li key={line.id} className="flex items-baseline gap-2.5">
              <span className="tnum min-w-[2.2ch] text-lg font-semibold">{line.quantity}×</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] leading-snug">{line.nameEn}</span>
                {line.note && <span className="block truncate text-[13px] font-medium text-warning">{line.note}</span>}
              </span>
            </li>
          ))}
          {hidden > 0 && <li className="text-[13px] text-muted-foreground">and {hidden} more…</li>}
        </ul>

        <p className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground">
          Details
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </p>
      </button>

      {/* The one move this card can make, full width and thumb-sized. */}
      <button
        type="button"
        onClick={onAdvance}
        disabled={busy}
        className={cn(
          'h-16 w-full text-lg font-semibold transition-opacity focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-60',
          order.status === 'NEW' ? 'bg-brand text-brand-on' : 'bg-success text-white',
        )}
      >
        {busy ? 'Saving…' : order.status === 'NEW' ? 'Start' : 'Served'}
      </button>
    </article>
  )
}
