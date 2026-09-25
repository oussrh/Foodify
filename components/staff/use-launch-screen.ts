// components/staff/use-launch-screen.ts
// When the launch screen covers an installed staff app, and when it lifts. It is decided once per
// page load, on the first read in the browser: installed, and not yet shown this session (a
// sessionStorage flag, so it comes back after the app is closed but not on a reload or a move
// between the app's screens). It lifts as soon as the app's first poll has answered, and never
// later than 1.2 s after the page began loading, whatever the network is doing.
'use client'

import { useEffect, useState } from 'react'
import { useClientValue } from '@/components/use-client-value'
import { launchScreenDue } from '@/lib/staff-device'
import { readStandalone } from './device-facts'

const SEEN_KEY = 'foodizar-launch-seen'
/** The longest the launch screen stands, counted from the start of the page load. */
const MAX_MS = 1200
/** The fade out; with reduced motion there is no fade, only this wait before it is removed. */
const LAUNCH_FADE_MS = 300

/** This page load's answer, once read; set to false when the screen lifts so a remount never shows it again. */
let thisLoad: boolean | null = null

/** Whether the session has already opened on the launch screen; refused storage reads as "not yet". */
function seenThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === 'yes'
  } catch {
    return false
  }
}

/** Whether this page load opens on the launch screen, decided on the first read and remembered for the session. */
function readLaunchDue(): boolean {
  if (thisLoad === null) {
    thisLoad = launchScreenDue({ installed: readStandalone(), seenThisSession: seenThisSession() })
    try {
      if (thisLoad) window.sessionStorage.setItem(SEEN_KEY, 'yes')
    } catch {
      // private window, or storage refused: the screen may show again next load, which is harmless
    }
  }
  return thisLoad
}

/**
 * The launch screen's phase: `server` before the browser has answered (it is rendered, and CSS
 * shows it only in an installed app's display mode), `showing`, `leaving` while it fades, `gone`.
 * `ready` is the app's first data: the screen lifts on it, or on the time limit.
 */
export function useLaunchScreen(ready: boolean): 'server' | 'showing' | 'leaving' | 'gone' {
  const due = useClientValue<boolean | null>(readLaunchDue, null)
  const [phase, setPhase] = useState<'showing' | 'leaving' | 'gone'>('showing')

  useEffect(() => {
    if (due !== true || phase !== 'showing') return
    const wait = ready ? 0 : Math.max(0, MAX_MS - performance.now())
    const timer = setTimeout(() => setPhase('leaving'), wait)
    return () => clearTimeout(timer)
  }, [due, ready, phase])

  useEffect(() => {
    if (phase !== 'leaving') return
    const timer = setTimeout(() => {
      thisLoad = false
      setPhase('gone')
    }, LAUNCH_FADE_MS)
    return () => clearTimeout(timer)
  }, [phase])

  if (due === null) return 'server'
  return due ? phase : 'gone'
}
