// components/pos/use-pos-action.ts
// Running one POS action from the Integrations tab: one at a time (the buttons wait), a refusal
// said in a toast in the words the server chose, and the page read again after anything that
// went through, so every screen shows the connection as it now stands.
'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Outcome = { ok: true } | { ok: false; error: string }

/**
 * `busy` while an action runs, and `run(work, done)`: the action's outcome, `done` toasted when it
 * went through and the page refreshed; the refusal toasted otherwise; null when the call itself failed.
 */
export function usePosAction() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const run = useCallback(
    async <T extends Outcome>(work: () => Promise<T>, done?: string): Promise<T | null> => {
      setBusy(true)
      try {
        const outcome = await work()
        if (!outcome.ok) {
          toast.error(outcome.error)
          return outcome
        }
        if (done) toast.success(done)
        router.refresh()
        return outcome
      } catch {
        toast.error('That did not go through. Try again.')
        return null
      } finally {
        setBusy(false)
      }
    },
    [router],
  )
  return { busy, run }
}
