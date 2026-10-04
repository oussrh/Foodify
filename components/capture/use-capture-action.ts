// components/capture/use-capture-action.ts
// Running one capture action from the dish form: one at a time (the buttons wait), a refusal said in
// a toast in the words the server chose. Unlike the settings tabs, the page is not read again: the
// dish form around it may hold edits not saved yet, and a refresh would reset them.
'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'

type Outcome = { ok: true } | { ok: false; error: string }

/** `busy` while an action runs; `run(work)` answers the outcome when it went through, null otherwise. */
export function useCaptureAction() {
  const [busy, setBusy] = useState(false)
  const run = useCallback(async <T extends Outcome>(work: () => Promise<T>): Promise<Extract<T, { ok: true }> | null> => {
    setBusy(true)
    try {
      const outcome = await work()
      if (outcome.ok) return outcome as Extract<T, { ok: true }>
      toast.error(outcome.error)
      return null
    } catch {
      toast.error('That did not go through. Try again.')
      return null
    } finally {
      setBusy(false)
    }
  }, [])
  return { busy, run }
}
