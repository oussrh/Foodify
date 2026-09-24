// components/staff/use-audio-unlock.ts
// The fix for the silent first order after a reload. The device remembers "sound on", but the
// browser has locked the audio again and will unlock it only inside a tap — so the first alert
// would play into a suspended context and nobody would hear it. While sound is wanted and the
// audio is locked, every tap anywhere on the page wakes it, and `locked` tells the screen to say
// so ("Tap anywhere to enable sound"), which iOS Safari especially needs.
'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { audioContextClass, audioRunning, subscribeAudio, wakeAudio } from '@/components/orders/audio-context'
import { useClientValue } from '@/components/use-client-value'
import { listenForGestures } from './gestures'

export interface AudioUnlock {
  /** Sound is on, the device has audio, and it is not running yet: ask for a tap. */
  locked: boolean
  /** Wakes the audio; the strip's own tap, though any tap on the page does the same. */
  unlock: () => void
}

const wake = () => {
  try {
    wakeAudio()
  } catch {
    // no audio on this device: the screen carries the alert on its own
  }
}

/** Whether the page's audio still needs a tap while `wanted` (sound on), and the tap that wakes it. */
export function useAudioUnlock(wanted: boolean): AudioUnlock {
  const audible = useClientValue(() => audioContextClass() !== undefined, false)
  const running = useSyncExternalStore(subscribeAudio, audioRunning, () => false)
  const locked = wanted && audible && !running

  useEffect(() => {
    if (!locked) return
    return listenForGestures(document, wake)
  }, [locked])

  const unlock = useCallback(() => wake(), [])
  return { locked, unlock }
}
