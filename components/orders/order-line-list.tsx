// components/orders/order-line-list.tsx
// What an order is, in the small type a list uses: how many of each dish, and what was asked for
// on it. The compact reading, shared by the pass's ready drawer and the waiter's order list —
// the roomier one belongs to the details sheet, which has a whole screen for it.
//
// A line note is shown wherever the lines are, never only in the details: "no onions" is the one
// thing on a ticket that goes wrong when it is a tap away instead of on the page. So is a dish
// taken off after it was sent: the count shown is what is left, and "−1" says what came off,
// with a line taken off whole struck through rather than hidden.
'use client'

import { effectiveQuantity, type BoardOrder } from '@/lib/orders'
import { cn } from '@/lib/utils'

interface OrderLineListProps {
  lines: BoardOrder['lines']
}

/**
 * An order's lines in compact form (how many of each dish is left, what came off, and the note
 * asked for on it) for the ready drawer and the waiter's lists.
 */
export default function OrderLineList({ lines }: OrderLineListProps) {
  return (
    <ul className="pt-2 text-[13px]">
      {lines.map((line) => {
        const left = effectiveQuantity(line)
        return (
          <li key={line.id} className="flex gap-2">
            <span className={cn('tnum shrink-0 font-semibold', left === 0 && 'text-muted-foreground line-through')}>{left === 0 ? line.quantity : left}×</span>
            <span className="min-w-0">
              <span className={cn('block truncate', left === 0 && 'text-muted-foreground line-through')}>{line.nameEn}</span>
              {line.removedQuantity > 0 && <span className="block font-semibold text-destructive">−{line.removedQuantity} removed</span>}
              {line.note && <span className="block truncate italic text-muted-foreground">{line.note}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
