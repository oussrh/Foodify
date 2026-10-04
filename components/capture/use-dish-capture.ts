// components/capture/use-dish-capture.ts
// A dish's capture as its AR section sees it: read once, then asked about while the engine works on
// it, and set by hand when the sheet starts one or the review settles one. The asking is one request
// at a time (the next is scheduled when the last has answered: an engine call can take longer than
// the interval), and an answer about a capture the card no longer shows is dropped (docs/LESSONS.md,
// "A poll's answers arrive in any order").
'use client'

import { useCallback, useEffect, useState } from 'react'
import { getDishCapture, refreshCapture } from '@/app/actions/capture-actions'
import type { CaptureView } from '@/lib/capture'

type State = Awaited<ReturnType<typeof getDishCapture>>
const POLL_MS = 5000

/**
 * `state` (null while loading), whether the engine is answering (`offline`), and `setJob` for the
 * capture the sheet started or the review put aside (null).
 */
export function useDishCapture(dishId: string) {
  const [state, setState] = useState<State | null>(null)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let live = true
    getDishCapture(dishId).then(
      (loaded) => live && setState(loaded),
      () => live && setState({ enabled: false }),
    )
    return () => {
      live = false
    }
  }, [dishId])

  const setJob = useCallback((job: CaptureView | null) => {
    setState((current) => (current?.enabled ? { ...current, job } : current))
  }, [])

  // Only the capture still shown takes an answer: one put aside meanwhile stays put aside.
  const followJob = useCallback((job: CaptureView) => {
    setState((current) => (current?.enabled && current.job?.id === job.id ? { ...current, job } : current))
  }, [])

  const processing = state?.enabled && state.job?.status === 'PROCESSING' ? state.job.id : null
  useEffect(() => {
    if (!processing) return
    let live = true
    let timer: ReturnType<typeof setTimeout>
    const ask = async () => {
      const outcome = await refreshCapture(processing).catch(() => null)
      if (!live) return
      if (outcome?.ok) {
        setOffline(outcome.offline)
        followJob(outcome.job)
      }
      timer = setTimeout(ask, POLL_MS)
    }
    timer = setTimeout(ask, POLL_MS)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [processing, followJob])

  return { state, offline, setJob }
}
