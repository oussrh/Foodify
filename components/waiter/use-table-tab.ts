// components/waiter/use-table-tab.ts
// The bill already open at the table the waiter is standing at (lib/table-tab.ts). Not the
// floor's poll: that one holds only what the kitchen is still working, and a bill whose first
// ticket was carried out an hour ago is exactly the one a table asking for dessert has.
//
// Read when the table opens, again whenever a sheet that shows or decides on it opens, and every
// fifteen seconds while the screen is visible, because the kitchen moves tickets on and a
// cancelled bill must stop being offered. Until the first read settles the screen does not know
// whether this table has a bill, so it says so instead of quietly opening a second one.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { call } from '@/lib/api-client'
import type { TableTab } from '@/lib/table-tab'

/** How often the bill is read again while the table's screen is visible. */
const REREAD_MS = 15_000

/** Where the read stands: not answered yet, answered (with a bill or null), or failed with nothing to go on. */
export type TableTabStatus = 'checking' | 'ready' | 'failed'

export interface TableTabState {
  status: TableTabStatus
  /** The table's open bill; null when it has none, or before a read has answered. */
  tab: TableTab | null
  /** Read it again now: a sheet opened, a send was answered, or the waiter asked to retry. */
  refresh: () => void
}

/** The open bill at `table`, from GET /api/orders/tab, kept fresh while the screen is visible. */
export function useTableTab(restaurantId: string, table: string): TableTabState {
  const [tab, setTab] = useState<TableTab | null>(null)
  const [status, setStatus] = useState<TableTabStatus>('checking')
  // False once the screen has gone: an answer that lands after it is dropped, never set.
  const live = useRef(true)

  const read = useCallback(async () => {
    const query = new URLSearchParams({ restaurantId, table })
    try {
      const { data } = await call<TableTab | null>(`/api/orders/tab?${query.toString()}`)
      if (!live.current) return
      setTab(data)
      setStatus('ready')
    } catch {
      if (!live.current) return
      // A bill already read stays on screen through a missed re-read; only a table never read fails.
      setStatus((was) => (was === 'ready' ? 'ready' : 'failed'))
    }
  }, [restaurantId, table])

  useEffect(() => {
    live.current = true
    const tick = () => {
      if (live.current && document.visibilityState === 'visible') void read()
    }
    tick()
    const timer = setInterval(tick, REREAD_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      live.current = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [read])

  const refresh = useCallback(() => void read(), [read])
  return { status, tab, refresh }
}
