// components/orders/use-request-decision.ts
// The pass answering the floor: accept or refuse a request to take something off a ticket being
// made (app/actions/ticket-actions.ts `decideRequest`), say what happened, and read the board
// again. One answer at a time: a second tap while the first is in flight does nothing.
'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { decideRequest } from '@/app/actions/ticket-actions'
import type { PendingRequest } from '@/lib/orders'

/** What a decision came to, in the words the toast uses. */
const ANSWERED: Record<'decided' | 'cancelled' | 'not_cooking' | 'bill_closed' | 'nothing_left', string> = {
  decided: 'Already answered on another screen',
  cancelled: 'That order was cancelled in the meantime',
  not_cooking: 'That order has left the kitchen: only a manager can void it now',
  bill_closed: 'That bill was closed in the meantime',
  nothing_left: 'Nothing is left of that dish to take off',
}

/** Accept or refuse a request, then `refresh` the board; `busy` while an answer is in flight. */
export function useRequestDecision(refresh: () => void) {
  const [busy, setBusy] = useState(false)
  const decide = useCallback(
    async (request: PendingRequest, accept: boolean) => {
      if (busy) return
      setBusy(true)
      try {
        const result = await decideRequest({ changeId: request.id, accept })
        if (result.ok) toast.success(accept ? 'Done: the waiter has been told' : 'Refused: the waiter has been told')
        else toast.error(ANSWERED[result.refused])
      } catch {
        toast.error('Could not answer. Try again.')
      } finally {
        setBusy(false)
        refresh()
      }
    },
    [busy, refresh],
  )
  return { decide, busy }
}
