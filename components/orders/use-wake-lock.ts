// components/orders/use-wake-lock.ts
// Keeps the tablet's screen on while the board is open. A kitchen screen that sleeps is a board
// nobody reads, and the alert is no use if the first thing staff must do is wake the device. The
// choice is remembered on the device, so a reload — or the tablet restarting overnight — comes
// back holding the screen without anyone having to find the button again; `keep-awake.ts` takes
// the lock, re-takes it when the page returns, and waits for a tap when the browser wants one.
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useDeviceSetting } from '@/components/staff/use-device-setting'
import { useClientValue } from '@/components/use-client-value'
import { keepScreenAwake, type ScreenLockApi } from './keep-awake'

type WakeLockNavigator = Navigator & { wakeLock?: ScreenLockApi }

/** Where the device remembers the choice. */
const KEY = 'foodify-screen-awake'

export interface WakeLock {
  /** False on a browser with no Screen Wake Lock API; the toggle is then not offered. */
  supported: boolean
  /** Whether the screen is meant to stay awake: the remembered choice. */
  on: boolean
  /** Whether a lock is actually held; on but not held is a browser waiting for a tap. */
  held: boolean
  toggle: () => void
}

/**
 * Keeps the screen on while the page is open when the device has been asked to, remembering the
 * choice across reloads and taking the lock again whenever the browser lets it go.
 */
export function useWakeLock(): WakeLock {
  // A browser fact, not state: read on the first client render rather than set from an effect.
  const supported = useClientValue(() => 'wakeLock' in navigator, false)
  const [on, setOn] = useDeviceSetting(KEY, false)
  const [held, setHeld] = useState(false)

  useEffect(() => {
    const api = on ? (navigator as WakeLockNavigator).wakeLock : undefined
    if (!api) return
    return keepScreenAwake(api, document, setHeld)
  }, [on])

  const toggle = useCallback(() => setOn(!on), [on, setOn])

  return { supported, on, held: on && held, toggle }
}
