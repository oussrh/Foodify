// components/waiter/use-bill-call.ts
// One call at a time from the table's bill sheet to the server: a cancel, a removal, a close, a
// merge, a move. Every one of them is followed by a fresh read of the bill, whatever the answer,
// because the kitchen may have moved on while the waiter was choosing; and a call that never
// reached the server says so, rather than leaving the waiter unsure whether it went.
'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'

/** `run(call, done)`: makes the call, hands its answer to `done`, then `onChanged`; `busy` meanwhile. */
export function useBillCall(onChanged: () => void) {
  const [busy, setBusy] = useState(false)
  const run = useCallback(
    async <T>(call: () => Promise<T>, done: (result: T) => void) => {
      setBusy(true)
      try {
        done(await call())
      } catch {
        toast.error('Could not reach the kitchen’s system. Try again.')
      } finally {
        setBusy(false)
        onChanged()
      }
    },
    [onChanged],
  )
  return { busy, run }
}
