// components/orders/order-line-list.tsx
// What an order is, in the small type a list uses: how many of each dish, and what was asked for
// on it. The compact reading, shared by the pass's ready drawer and the waiter's order list —
// the roomier one belongs to the details sheet, which has a whole screen for it.
//
// A line note is shown wherever the lines are, never only in the details: "no onions" is the one
// thing on a ticket that goes wrong when it is a tap away instead of on the page.
'use client'

import type { BoardOrder } from '@/lib/orders'

interface OrderLineListProps {
  lines: BoardOrder['lines']
}

export default function OrderLineList({ lines }: OrderLineListProps) {
  return (
    <ul className="pt-2 text-[13px]">
      {lines.map((line) => (
        <li key={line.id} className="flex gap-2">
          <span className="tnum shrink-0 font-semibold">{line.quantity}×</span>
          <span className="min-w-0">
            <span className="block truncate">{line.nameEn}</span>
            {line.note && <span className="block truncate italic text-muted-foreground">{line.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}
