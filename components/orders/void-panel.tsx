// components/orders/void-panel.tsx
// A manager voiding a dish, or a whole ticket, from the order's details: the reason picked in one
// tap (reason-picker.tsx), the void applied at once, and the sheet told so it reads the order
// again. The dish stays on the ticket as voided; only the total changes.
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { voidLine, voidTicket } from '@/app/actions/void-actions'
import { TICKET_REFUSED } from '@/lib/bill-rules'
import { effectiveQuantity, type BoardLine, type BoardOrder } from '@/lib/orders'
import { ReasonPicker, type ReasonChoice } from './reason-picker'

interface VoidPanelProps {
  order: BoardOrder
  /** The line to void, or null for the whole ticket. */
  line: BoardLine | null
  /** The void went through: the caller reads the order again and closes the panel. */
  onDone: () => void
  onBack: () => void
}

/** The reason picker for a manager's void, and the call that applies it. */
export default function VoidPanel({ order, line, onDone, onBack }: VoidPanelProps) {
  const [busy, setBusy] = useState(false)

  const apply = async ({ reason, note, quantity }: ReasonChoice) => {
    setBusy(true)
    try {
      const result = line ? await voidLine({ lineId: line.id, quantity, reason, note }) : await voidTicket({ orderId: order.id, reason, note })
      if (!result.ok) {
        toast.error(TICKET_REFUSED[result.refused])
        return
      }
      toast.success(line ? `Voided ${quantity} ${line.nameEn}` : `Voided order #${order.number}`)
      onDone()
    } catch {
      toast.error('Could not void that. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ReasonPicker
      title={line ? `Void ${line.nameEn}` : `Void order #${order.number}`}
      maxQuantity={line ? effectiveQuantity(line) : null}
      busy={busy}
      onPick={apply}
      onBack={onBack}
    />
  )
}
