// components/waiter/waiter-tables.tsx
// The room. Two polls rather than one: what the kitchen is still cooking, and what it has just
// finished — because a waiter's two questions are "how long" and "what can I carry now", and the
// second is the one that decays if nobody answers it. A table with food up outranks everything
// else on the screen, and the phone says so with a buzz whether or not anyone is looking.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { Ban, Bell, BellOff, Download, RefreshCw, WifiOff } from 'lucide-react'
import { useMinuteClock } from '@/components/orders/use-minute-clock'
import { useOrderBoard } from '@/components/orders/use-order-board'
import { useStaffPwa } from '@/components/staff/use-staff-pwa'
import { Button } from '@/components/ui/button'
import { floorTiles, newlyReady, readyOrders } from '@/lib/waiter-floor'
import { tableNumbers } from '@/components/qr/table-qr'
import { cn } from '@/lib/utils'
import { TableTile } from './table-tile'
import { useReadyAlert } from './use-ready-alert'

/** The kitchen's poll announces new orders; a waiter's must not — they placed them. */
const silent = () => undefined

const CONTROL = 'h-12 min-w-12 px-3'

interface WaiterTablesProps {
  restaurant: { id: string; name: string; tableCount: number }
  onOpenTable: (table: string) => void
}

export function WaiterTables({ restaurant, onOpenTable }: WaiterTablesProps) {
  const alert = useReadyAlert()
  const pwa = useStaffPwa()
  // One clock for every tile, so the waits tick without each one reading it in render.
  const now = new Date(useMinuteClock())

  // Which tables are glowing, and which ready orders have already been announced. A ref, not
  // state: the poll's callback must keep the same identity or its timer restarts every render.
  const announced = useRef<Set<string>>(new Set())
  const [flashing, setFlashing] = useState<string[]>([])

  const open = useOrderBoard(restaurant.id, 'open', silent)
  const finished = useOrderBoard(restaurant.id, 'served', silent)

  const ready = readyOrders(finished.orders, now)
  const tiles = floorTiles(tableNumbers(restaurant.tableCount), open.orders, ready, now)
  const readyTables = tiles.filter((tile) => tile.state === 'ready')

  const refresh = useCallback(() => {
    open.refresh()
    finished.refresh()
  }, [open, finished])

  // `ready` is a new array every render, so it cannot be a dependency: what actually changes is
  // the set of ids in it. The rest is read through a ref written after each render, rather than
  // during one, so announcing does not re-run just because a clock ticked.
  const readyIds = ready.map((order) => order.id).join(',')
  const latest = useRef({ ready, alert })
  useEffect(() => {
    latest.current = { ready, alert }
  })

  useEffect(() => {
    const { ready: current, alert: announce } = latest.current
    const fresh = newlyReady(current, announced.current)
    if (fresh.length === 0) return
    for (const id of fresh) announced.current.add(id)
    announce.alert()
    setFlashing(current.filter((order) => fresh.includes(order.id)).map((order) => order.table))
    const stop = setTimeout(() => setFlashing([]), 20_000)
    return () => clearTimeout(stop)
  }, [readyIds])

  const tables = tiles.length

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold leading-tight tracking-display">Tables</h1>
            <p className="truncate text-xs text-muted-foreground">{restaurant.name}</p>
          </div>
          {!open.online && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
              Offline
            </span>
          )}
          {pwa.canInstall && (
            <Button variant="outline" className={CONTROL} onClick={pwa.install} aria-label="Install this app on the phone">
              <Download className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="outline"
            className={CONTROL}
            onClick={alert.toggleSound}
            aria-pressed={alert.soundOn}
            aria-label={alert.soundOn ? 'Sound on — tap for buzz only' : 'Buzz only — tap to add a sound'}
          >
            {alert.soundOn ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </Button>
          <Button asChild variant="outline" className={CONTROL}>
            <Link href={`/waiter/${restaurant.id}/availability` as Route} aria-label="Mark a dish sold out">
              <Ban className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" className={CONTROL} onClick={refresh} aria-label="Check the kitchen again">
            <RefreshCw className={cn('h-5 w-5', (open.loading || finished.loading) && 'animate-spin')} />
          </Button>
        </div>

        {readyTables.length > 0 && (
          // The one line worth putting above everything: what is going cold.
          <p className="border-t border-border bg-success px-3 py-2 text-sm font-semibold text-white" role="status">
            Ready to carry: table{readyTables.length === 1 ? '' : 's'} {readyTables.map((tile) => tile.table).join(', ')}
          </p>
        )}
      </header>

      <main className="flex-1 px-3 py-4">
        {tables === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            No tables are set for this restaurant yet. An administrator sets how many in Settings.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {tiles.map((tile) => (
              <li key={tile.table}>
                <TableTile tile={tile} flashing={flashing.includes(tile.table)} onOpen={() => onOpenTable(tile.table)} />
              </li>
            ))}
          </ul>
        )}

        <p className="tnum pt-4 text-center text-xs text-muted-foreground">
          {open.orders.length} with the kitchen · {ready.length} ready ·{' '}
          <button type="button" onClick={alert.test} className="underline underline-offset-2">
            test the alert
          </button>
        </p>
      </main>
    </div>
  )
}
