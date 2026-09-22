// components/staff/use-sound-setting.ts
// Whether a staff screen makes a noise, remembered on the device rather than against the account:
// it belongs to the room the screen stands in, not to whoever signed in. A tablet on a pass wants
// sound and a phone in a dining room usually does not, which is why the fallback is the caller's.
//
// Turning it on wakes the audio without ringing. A browser refuses to play anything until a
// gesture has happened on the page, so the tap has to be used — but a switch that plays the alert
// every time it is flicked is a switch nobody flicks to check, which is exactly what staff do
// before service.
'use client'

import { useCallback, useState } from 'react'
import { useClientValue } from '@/components/use-client-value'

export interface SoundSetting {
  on: boolean
  /** Flips it, remembers it, and wakes the audio on the way on. Silent either way. */
  toggle: () => void
}

/** What the device remembers; a server render, and a browser that refuses storage, both fall back. */
function stored(key: string, fallback: boolean): boolean {
  try {
    const value = window.localStorage.getItem(key)
    return value === null ? fallback : value === 'on'
  } catch {
    // private window, or storage refused
    return fallback
  }
}

/**
 * `prime` is the chime's own — it opens and resumes that screen's audio context, which is what
 * the gesture is needed for. `key` and `fallback` must be constants, not built in render.
 */
export function useSoundSetting(key: string, fallback: boolean, prime: () => void): SoundSetting {
  // Read through useSyncExternalStore rather than set from an effect, so the first client render
  // already knows; `chosen` is this session's override, which is what a tap changes.
  const remembered = useClientValue(() => stored(key, fallback), fallback)
  const [chosen, setChosen] = useState<boolean | null>(null)
  const on = chosen ?? remembered

  const toggle = useCallback(() => {
    const next = !on
    setChosen(next)
    try {
      window.localStorage.setItem(key, next ? 'on' : 'off')
    } catch {
      // the session keeps the choice even when storage will not
    }
    if (next) prime()
  }, [on, key, prime])

  return { on, toggle }
}
