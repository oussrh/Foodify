// components/orders/use-wake-lock.ts
// Keeps the tablet's screen on while the board is open. A kitchen screen that sleeps is a board
// nobody reads, and the alert is no use if the first thing staff must do is wake the device. The
// lock is dropped by the browser whenever the page is hidden, so it is taken again when the page
// comes back; a browser without the API simply reports that it is unsupported.
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useClientValue } from '@/components/use-client-value'

type Sentinel = { released: boolean; release: () => Promise<void>; addEventListener: (type: 'release', listener: () => void) => void }
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<Sentinel> } }

export interface WakeLock {
  /** False on a browser with no Screen Wake Lock API; the toggle is then not offered. */
  supported: boolean
  /** Whether the screen is being held awake right now. */
  on: boolean
  toggle: () => void
}

export function useWakeLock(): WakeLock {
  // A browser fact, not state: read on the first client render rather than set from an effect.
  const supported = useClientValue(() => 'wakeLock' in navigator, false)
  const [on, setOn] = useState(false)
  const [sentinel, setSentinel] = useState<Sentinel | null>(null)

  // Taking the lock is the caller's; re-taking it after the page was hidden is this effect's.
  useEffect(() => {
    if (!on) return
    let current: Sentinel | null = null
    let live = true

    const take = async () => {
      try {
        const lock = await (navigator as WakeLockNavigator).wakeLock?.request('screen')
        if (!lock) return
        if (!live) {
          void lock.release()
          return
        }
        current = lock
        setSentinel(lock)
      } catch {
        // refused (a battery saver, a policy): the board works, the screen just sleeps
      }
    }

    void take()
    const onVisible = () => {
      if (document.visibilityState === 'visible' && (!current || current.released)) void take()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      live = false
      document.removeEventListener('visibilitychange', onVisible)
      void current?.release().catch(() => undefined)
      setSentinel(null)
    }
  }, [on])

  const toggle = useCallback(() => {
    setOn((previous) => {
      if (previous) void sentinel?.release().catch(() => undefined)
      return !previous
    })
  }, [sentinel])

  return { supported, on, toggle }
}
