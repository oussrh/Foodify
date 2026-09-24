// components/waiter/waiter-sent.tsx
// What the waiter sees once the kitchen has the order: a tick, the number, and one way back to
// the room. An addition says which bill it joined rather than its own number, because "added to
// order #12" is the sentence the waiter repeats to the table.
'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WaiterSentProps {
  /** The number the kitchen gave this order. */
  number: number
  /** The bill it was added to, or null when it opened one. */
  addedTo: number | null
  table: string
  restaurantName: string
  onDone: () => void
}

/** The confirmation after a send: "Order #14 sent", or "Added to order #12" for an addition. */
export function WaiterSent({ number, addedTo, table, restaurantName, onDone }: WaiterSentProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <Check className="h-14 w-14 text-success" aria-hidden="true" />
      <p className="text-2xl font-semibold tracking-display">{addedTo === null ? `Order #${number} sent` : `Added to order #${addedTo}`}</p>
      <p className="text-muted-foreground">
        Table {table} · {restaurantName}
      </p>
      <Button className="mt-4 h-14 w-full max-w-xs text-[15px]" onClick={onDone}>
        Back to the tables
      </Button>
    </div>
  )
}
