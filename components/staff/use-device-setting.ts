// components/staff/use-device-setting.ts
// An on/off a staff device remembers for itself: the board's sound, the screen held awake, the
// waiter's chime. Stored on the device rather than against the account, because it belongs to the
// room the screen is in and not to whoever signed in; and read back on the first client render,
// so a reload comes back the way it was left instead of flashing the default first.
'use client'

import { useCallback, useState } from 'react'
import { useClientValue } from '@/components/use-client-value'

/** What the device remembers under `key`; a server render, a private window and refused storage all fall back. */
export function readDeviceSetting(key: string, fallback: boolean): boolean {
  try {
    const value = window.localStorage.getItem(key)
    return value === null ? fallback : value === 'on'
  } catch {
    return fallback
  }
}

/** Remembers `value` under `key`; where storage is refused the session keeps it on its own. */
export function writeDeviceSetting(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, value ? 'on' : 'off')
  } catch {
    // private window, or storage refused
  }
}

/**
 * The remembered value and its setter. `key` and `fallback` must be constants, not built in
 * render. The value is read through `useClientValue` rather than set from an effect, and a set
 * during this session overrides it at once while it is written through to storage.
 */
export function useDeviceSetting(key: string, fallback: boolean): [boolean, (next: boolean) => void] {
  const remembered = useClientValue(() => readDeviceSetting(key, fallback), fallback)
  const [chosen, setChosen] = useState<boolean | null>(null)

  const set = useCallback(
    (next: boolean) => {
      setChosen(next)
      writeDeviceSetting(key, next)
    },
    [key],
  )

  return [chosen ?? remembered, set]
}
