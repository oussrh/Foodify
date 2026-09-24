// components/staff/sound-unlock-strip.tsx
// Said across the top of the screen while sound is on but the browser will not play it yet —
// after every reload, and on an iPhone after a call. Without it the first alert of the day is
// silent and nobody knows why. The strip is itself a button, thumb-sized, but any tap anywhere
// does the same (`use-audio-unlock.ts`); it goes away the moment the audio is running.
'use client'

import { Volume2 } from 'lucide-react'

/** The "Tap anywhere to enable sound" strip, shown only while `locked`. */
export function SoundUnlockStrip({ locked, onUnlock }: { locked: boolean; onUnlock: () => void }) {
  if (!locked) return null
  return (
    <button
      type="button"
      onClick={onUnlock}
      className="flex min-h-12 w-full items-center justify-center gap-2 border-t border-border bg-warning/15 px-3 py-2 text-[15px] font-semibold text-foreground"
    >
      <Volume2 className="h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
      Tap anywhere to enable sound
    </button>
  )
}
