// components/waiter/waiter-tables.tsx
// The room. Two polls rather than one: what the kitchen is still cooking, and what it has just
// finished — because a waiter's two questions are "how long" and "what can I carry now", and the
// second is the one that decays if nobody answers it. A table with food up outranks everything
// else on the screen, and the phone says so with a buzz whether or not anyone is looking.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, BellOff, Download } from 'lucide-react'
import { useMinuteClock } from '@/components/orders/use-minute-clock'
import { useOrderBoard } from '@/components/orders/use-order-board'
import { DeviceSetupSheet } from '@/components/staff/device-setup/device-setup-sheet'
import { InstallInvitation } from '@/components/staff/install-invitation'
import { LaunchScreen } from '@/components/staff/launch-screen'
import { SoundUnlockStrip } from '@/components/staff/sound-unlock-strip'
import { useAppBadge } from '@/components/staff/use-app-badge'
import { useAudioUnlock } from '@/components/staff/use-audio-unlock'
import { useStaffPwa } from '@/components/staff/use-staff-pwa'
import { UpdateBar } from '@/components/staff/update-bar'
import { Button } from '@/components/ui/button'
import { floorTiles, newlyReady, readyOrders } from '@/lib/waiter-floor'
import { tableNumbers } from '@/components/qr/table-qr'
import { TableTile } from './table-tile'
import { useReadyAlert } from './use-ready-alert'
import { WaiterHeader } from './waiter-header'
import { WaiterNav } from './waiter-nav'

/** The kitchen's poll announces new orders; a waiter's must not — they placed them. */
const silent = () => undefined

const CONTROL = 'h-12 min-w-12 px-3'

interface WaiterTablesProps {
  restaurant: { id: string; code: string; name: string; tableCount: number }
  onOpenTable: (table: string) => void
}

/**
 * The room: a tile per table from two polls, what is cooking and what is ready, with ready tables
 * listed at the top and a buzz when one comes up.
 */
export function WaiterTables({ restaurant, onOpenTable }: WaiterTablesProps) {
  const alert = useReadyAlert()
  // Sound the waiter turned on yesterday is locked again after a reload until the next tap.
  const audio = useAudioUnlock(alert.soundOn)
  const pwa = useStaffPwa()
  // One clock for every tile, so the waits tick without each one reading it in render.
  const now = new Date(useMinuteClock())

  // Which tables are glowing, and which ready orders have already been announced. A ref, not
  // state: the poll's callback must keep the same identity or its timer restarts every render.
  const announced = useRef<Set<string>>(new Set())
  const [flashing, setFlashing] = useState<string[]>([])

  // One poll: `READY` is an open status, so what the kitchen holds and what is up on the pass
  // arrive together and the ready ones are simply the ones it has called up.
  const open = useOrderBoard(restaurant.id, 'open', silent)

  const ready = readyOrders(open.orders)
  const cooking = open.orders.filter((order) => order.status !== 'READY')
  const tiles = floorTiles(tableNumbers(restaurant.tableCount), cooking, ready, now)
  const readyTables = tiles.filter((tile) => tile.state === 'ready')
  // The app icon counts the tables with food up: what a waiter in another app needs to know.
  useAppBadge(open.loading ? null : readyTables.length)

  const refresh = useCallback(() => open.refresh(), [open])

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
    <div className="staff-app flex min-h-screen flex-col bg-background">
      <header className="staff-safe-top sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <WaiterHeader
          title="Tables"
          restaurantName={restaurant.name}
          online={open.online}
          loading={open.loading}
          onRefresh={refresh}
        >
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
          <DeviceSetupSheet
            restaurantId={restaurant.id}
            app="waiter"
            pwa={pwa}
            sound={{ on: alert.soundOn, locked: audio.locked, toggle: alert.toggleSound, test: alert.test }}
            vibration={{ supported: alert.canVibrate, test: alert.buzz }}
            labelled
          />
        </WaiterHeader>
        <SoundUnlockStrip locked={audio.locked} onUnlock={audio.unlock} />
        <UpdateBar app="waiter" />

        {readyTables.length > 0 && (
          // The one line worth putting above everything: what is going cold.
          <p className="border-t border-border bg-success px-3 py-2 text-sm font-semibold text-white" role="status">
            Ready to carry: table{readyTables.length === 1 ? '' : 's'} {readyTables.map((tile) => tile.table).join(', ')}
          </p>
        )}
      </header>

      {/* Room for the tab bar: a list that ends under it hides its own last row. */}
      <main className="flex-1 px-3 pb-28 pt-4">
        <InstallInvitation app="waiter" pwa={pwa} />
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
          {cooking.length} with the kitchen · {ready.length} ready ·{' '}
          <button type="button" onClick={alert.test} className="underline underline-offset-2">
            test the alert
          </button>
        </p>
        {/* Said once, plainly: an iPhone has no vibration API and no app can add one, so a waiter
            on one knows to leave the sound on rather than wondering why nothing buzzes. */}
        {!alert.canVibrate && (
          <p className="pt-1 text-center text-xs text-muted-foreground">
            This phone cannot vibrate from a web app. Turn the sound on, or watch for the tile.
          </p>
        )}
      </main>

      <WaiterNav restaurantId={restaurant.code} active="tables" />
      <LaunchScreen app="waiter" ready={!open.loading} />
    </div>
  )
}
