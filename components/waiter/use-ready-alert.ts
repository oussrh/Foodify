// components/waiter/use-ready-alert.ts
// How a waiter's phone says "table 6 is up". A dining room is not a kitchen: the tablet on the
// pass rings a bell across a noisy line, and the same noise in front of guests is rude. So the
// default here is the buzz and nothing else, with sound as a choice the waiter makes — and the
// choice is remembered per device, because it belongs to the room they work in, not the account.
'use client'

import { useCallback } from 'react'
import { WAITER_CHIME } from '@/components/orders/chime-pattern'
import { useChime } from '@/components/orders/use-chime'
import { useSoundSetting } from '@/components/staff/use-sound-setting'
import { useClientValue } from '@/components/use-client-value'

const SOUND_KEY = 'foodify-waiter-sound'
/** A dining room's default: the buzz alone, with sound as something the waiter asks for. */
const SOUND_DEFAULT = false
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

/** Whether the browser exposes vibration. iOS Safari does not, on any iPhone, by design. */
const vibrationAvailable = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'

/**
 * How the waiter's phone says food is up: a buzz by default, a falling chime only if the waiter
 * turns sound on, remembered per device.
 */
export function useReadyAlert(): ReadyAlert {
  // The waiter's own voice: lower, falling and quieter than the kitchen's bell, so the two are
  // told apart in a room where both can be heard.
  const { play: chime, prime } = useChime(WAITER_CHIME)
  const canVibrate = useClientValue(vibrationAvailable, false)
  // The same device setting the kitchen tablet keeps, under this app's own key: a switch, not a
  // demonstration — turning it on wakes the audio without ringing, and `test` is what rings.
  const sound = useSoundSetting(SOUND_KEY, SOUND_DEFAULT, prime)

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
    if (sound.on) chime()
  }, [buzz, chime, sound.on])

  const test = useCallback(() => {
    buzz()
    chime()
  }, [buzz, chime])

  return { alert, canVibrate, soundOn: sound.on, toggleSound: sound.toggle, test }
}
