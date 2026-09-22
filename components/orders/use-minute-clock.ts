// components/orders/use-minute-clock.ts
// The clock the order screens read. A wait is shown in minutes, so it is re-read twice a minute
// and not on every render: one timer per screen, not one per card, and nothing impure in render.
'use client'

import { useEffect, useState } from 'react'

/** How often the screens re-read the clock: twice a minute, which is enough for a figure in minutes. */
const TICK_MS = 30000

/** The current time in milliseconds, refreshed on a timer for as long as the screen is mounted. */
export function useMinuteClock(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(timer)
  }, [])
  return now
}
