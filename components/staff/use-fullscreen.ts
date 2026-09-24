// components/staff/use-fullscreen.ts
// Full screen for a tablet running the app in a browser tab: the address bar and the system bars
// are room the orders could use. An installed app is already full screen and an iPhone has no
// Fullscreen API for pages, so the caller offers this only where `supported` says it can work.
'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { useClientValue } from '@/components/use-client-value'

export interface Fullscreen {
  supported: boolean
  active: boolean
  toggle: () => void
}

const subscribe = (onChange: () => void) => {
  document.addEventListener('fullscreenchange', onChange)
  return () => document.removeEventListener('fullscreenchange', onChange)
}
const ignore = () => undefined

/** Whether the page can go full screen, whether it is, and the tap that switches it. */
export function useFullscreen(): Fullscreen {
  const supported = useClientValue(() => document.fullscreenEnabled === true, false)
  const active = useSyncExternalStore(subscribe, () => document.fullscreenElement !== null, () => false)

  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(ignore)
    else void document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(ignore)
  }, [])

  return { supported, active, toggle }
}
