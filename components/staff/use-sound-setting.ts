// components/staff/use-sound-setting.ts
// Whether a staff screen makes a noise, remembered on the device (`use-device-setting.ts`). A
// tablet on a pass wants sound and a phone in a dining room usually does not, which is why the
// fallback is the caller's.
//
// Turning it on wakes the audio without ringing. A browser refuses to play anything until a
// gesture has happened on the page, so the tap has to be used — but a switch that plays the alert
// every time it is flicked is a switch nobody flicks to check, which is exactly what staff do
// before service. After a reload the setting is still on but the audio is locked again until the
// next tap; `use-audio-unlock.ts` is what says so and takes that tap.
'use client'

import { useCallback } from 'react'
import { useDeviceSetting } from './use-device-setting'

export interface SoundSetting {
  on: boolean
  /** Flips it, remembers it, and wakes the audio on the way on. Silent either way. */
  toggle: () => void
}

/**
 * `prime` is the chime's own — it opens and resumes the page's audio context, which is what the
 * gesture is needed for. `key` and `fallback` must be constants, not built in render.
 */
export function useSoundSetting(key: string, fallback: boolean, prime: () => void): SoundSetting {
  const [on, set] = useDeviceSetting(key, fallback)

  const toggle = useCallback(() => {
    set(!on)
    if (!on) prime()
  }, [on, set, prime])

  return { on, toggle }
}
