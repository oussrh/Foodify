// components/waiter/use-ready-alert.ts
// How a waiter's phone says "table 6 is up". A dining room is not a kitchen: the tablet on the
// pass rings a bell across a noisy line, and the same noise in front of guests is rude. So the
// default here is the buzz and nothing else, with sound as a choice the waiter makes — and the
// choice is remembered per device, because it belongs to the room they work in, not the account.
'use client'

import { useCallback, useState } from 'react'
import { WAITER_CHIME } from '@/components/orders/chime-pattern'
import { useChime } from '@/components/orders/use-chime'
import { useClientValue } from '@/components/use-client-value'

const SOUND_KEY = 'foodify-waiter-sound'
/**
 * Buzz, buzz, buzzzz: two taps and a longer third. A single short pulse is lost against a phone
 * bumping about in an apron pocket while someone walks, and a steady repeat reads as a phone
 * call. The rising length is what makes it feel deliberate, and the whole thing is under a
 * second so it is never felt as an alarm.
 */
const PATTERN = [180, 90, 180, 90, 320]

export interface ReadyAlert {
  /** Fire it: a buzz, and the chime when the waiter has asked for one. */
  alert: () => void
  /** Whether this device has a vibration API at all; an iPhone does not, and no app can add one. */
  canVibrate: boolean
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

/** Whether the browser exposes vibration. iOS Safari does not, on any iPhone, by design. */
const vibrationAvailable = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'

export function useReadyAlert(): ReadyAlert {
  // The waiter's own voice: lower, falling and quieter than the kitchen's bell, so the two are
  // told apart in a room where both can be heard.
  const { play: chime, prime } = useChime(WAITER_CHIME)
  const canVibrate = useClientValue(vibrationAvailable, false)
  // Read through useSyncExternalStore rather than set from an effect, so the first client render
  // already knows. `chosen` is this session's override, which is what a tap changes.
  const remembered = useClientValue(storedSound, false)
  const [chosen, setChosen] = useState<boolean | null>(null)
  const soundOn = chosen ?? remembered

  const buzz = useCallback(() => {
    try {
      // Android and desktop Chrome honour it; iOS Safari has no vibration API and simply does
      // not, which is why the tile glows and the band appears whatever the phone can do.
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
    // Wake the audio without ringing. The tap is the gesture a browser needs before it will
    // play anything, so it has to be used — but a switch that plays the alert every time it is
    // turned on is a switch that shouts at whoever is only checking it is on. "Test the alert"
    // is the control for hearing it, and that one is asked for.
    if (next) prime()
  }, [prime, soundOn])

  const test = useCallback(() => {
    buzz()
    chime()
  }, [buzz, chime])

  return { alert, canVibrate, soundOn, toggleSound, test }
}
