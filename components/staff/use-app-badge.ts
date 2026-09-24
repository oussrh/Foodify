// components/staff/use-app-badge.ts
// The number on the installed app's icon: the board's open orders, the waiter's tables with food
// up. Someone who switched to another app still sees that the pass wants them. Supported by the
// Badging API where it exists (Chrome and Edge on installed apps, iOS 16.4+ once notifications are
// allowed); everywhere else it simply does nothing.
'use client'

import { useEffect } from 'react'

/** Shows `count` on the app's icon, clearing it at zero; `null` leaves whatever is there alone. */
export function useAppBadge(count: number | null): void {
  useEffect(() => {
    if (count === null || !('setAppBadge' in navigator)) return
    const change = count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge()
    // Refused (not installed, or no permission on iOS): the screen already shows the count.
    change.catch(() => undefined)
  }, [count])
}
