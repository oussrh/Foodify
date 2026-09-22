// components/waiter/use-ready-alert.ts
// How a waiter's phone says "table 6 is up". A dining room is not a kitchen: the tablet on the
// pass rings a bell across a noisy line, and the same noise in front of guests is rude. So the
// default here is the buzz and nothing else, with sound as a choice the waiter makes — and the
// choice is remembered per device, because it belongs to the room they work in, not the account.
'use client'

import { useCallback, useState } from 'react'
import { useChime } from '@/components/orders/use-chime'
import { useClientValue } from '@/components/use-client-value'

const SOUND_KEY = 'foodify-waiter-sound'
/** Two short pulses: felt through an apron pocket, invisible to the table being served. */
const PATTERN = [120, 90, 120]

export interface ReadyAlert {
  /** Fire it: a buzz, and the chime when the waiter has asked for one. */
  alert: () => void
  soundOn: boolean
  toggleSound: () => void
  /** Play it now, so a waiter can check the phone is not on silent before service. */
  test: () => void
}

/** What the device remembers; a server render, and a browser that refuses storage, both say off. */
function storedSound(): boolean {
  try {
    return window.localStorage.getItem(SOUND_KEY) === 'on'
  } catch {
    // private window, or storage refused: the buzz alone is the safe default
    return false
  }
}

export function useReadyAlert(): ReadyAlert {
  const chime = useChime()
  // Read through useSyncExternalStore rather than set from an effect, so the first client render
  // already knows. `chosen` is this session's override, which is what a tap changes.
  const remembered = useClientValue(storedSound, false)
  const [chosen, setChosen] = useState<boolean | null>(null)
  const soundOn = chosen ?? remembered

  const buzz = useCallback(() => {
    try {
      // Android and desktop Chrome honour it; iOS Safari has no vibration API and simply does not.
      navigator.vibrate?.(PATTERN)
    } catch {
      // never worth an error: the tile is already glowing
    }
  }, [])

  const alert = useCallback(() => {
    buzz()
    if (soundOn) chime()
  }, [buzz, chime, soundOn])

  const toggleSound = useCallback(() => {
    const next = !soundOn
    setChosen(next)
    try {
      window.localStorage.setItem(SOUND_KEY, next ? 'on' : 'off')
    } catch {
      // the session keeps the choice even when storage will not
    }
    // Play it on the way on: the tap is the gesture a browser needs before it will make a sound.
    if (next) chime()
  }, [chime, soundOn])

  const test = useCallback(() => {
    buzz()
    chime()
  }, [buzz, chime])

  return { alert, soundOn, toggleSound, test }
}
