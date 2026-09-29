// components/orders/reprint-button.tsx
// Printing a ticket again from the board: the paper was lost on the pass, or the printer was out
// of it. It prints as the ticket now stands, on every printer of the restaurant.
'use client'

import { useState } from 'react'
import { Printer } from 'lucide-react'
import { toast } from 'sonner'
import { reprintTicket } from '@/app/actions/order-actions'
import { Button } from '@/components/ui/button'

/** Reprint order `orderId` (#`number`), said in a toast either way. */
export default function ReprintButton({ orderId, number }: { orderId: string; number: number }) {
  const [busy, setBusy] = useState(false)

  const reprint = async () => {
    setBusy(true)
    try {
      const { ok } = await reprintTicket(orderId)
      if (ok) toast.success(`Ticket #${number} sent to the printer`)
      else toast.error('That order is no longer here.')
    } catch {
      toast.error('That did not go through. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant="outline" className="mt-2 h-14 w-full text-[15px]" disabled={busy} onClick={() => void reprint()}>
      <Printer className="h-4 w-4" />
      Reprint ticket
    </Button>
  )
}
