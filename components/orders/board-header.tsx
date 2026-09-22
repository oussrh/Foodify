// components/orders/board-header.tsx
// The board's one strip of chrome: where it is, how many orders are open, whether the server is
// answering, what is up on the pass, and this device's own switches (board-controls.tsx).
'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { ArrowLeft, Ban, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BoardView } from '@/lib/orders'
import { cn } from '@/lib/utils'
import type { StaffPwa } from '@/components/staff/use-staff-pwa'
import BoardControls from './board-controls'
import type { WakeLock } from './use-wake-lock'

interface BoardHeaderProps {
  restaurantName: string
  view: BoardView
  onView: (view: BoardView) => void
  openCount: number
  online: boolean
  loading: boolean
  onRefresh: () => void
  /** Whether this tablet makes a noise when an order arrives; remembered on the device. */
  soundOn: boolean
  onToggleSound: () => void
  /** The handle for what is up on the pass: a count on the board, the list only when asked for. */
  readyDrawer: React.ReactNode
  wakeLock: WakeLock
  pwa: StaffPwa
  /** Absent on a kitchen tablet: there is no portal behind it to go back to. */
  backHref?: Route | undefined
  /** The sold-out screen for this restaurant: the pass is where a dish runs out. */
  soldOutHref: Route
}

const CONTROL = 'h-12 min-w-12 px-3'

export default function BoardHeader({ restaurantName, view, onView, openCount, online, loading, onRefresh, soundOn, onToggleSound, readyDrawer, wakeLock, pwa, backHref, soldOutHref }: BoardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-4">
        {backHref && !pwa.installed && (
          <Button asChild variant="ghost" size="icon" className="h-12 w-12 shrink-0">
            <Link href={backHref} aria-label="Back to the dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold leading-tight tracking-display">
            Orders
            {view === 'open' && <span className="tnum ml-2 rounded-full bg-brand px-2.5 py-0.5 text-sm text-brand-on">{openCount}</span>}
          </h1>
          <p className="truncate text-xs text-muted-foreground">{restaurantName}</p>
        </div>

        {/* What the board is showing. Two targets, both thumb-sized, the current one filled. */}
        <div role="group" aria-label="Which orders to show" className="flex h-12 shrink-0 rounded-md border border-border bg-card p-1">
          {(['open', 'served'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onView(option)}
              aria-pressed={view === option}
              className={cn(
                'rounded-[5px] px-4 text-[15px] font-semibold transition-colors',
                view === option ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option === 'open' ? 'Open' : 'Served'}
            </button>
          ))}
        </div>

        {!online && (
          <span role="status" className="inline-flex h-12 items-center gap-1.5 rounded-full bg-warning/15 px-3 text-sm font-medium text-warning">
            <WifiOff className="h-4 w-4" />
            <span className="hidden sm:inline">Offline — last known orders</span>
          </span>
        )}

        <Button asChild variant="outline" className={CONTROL}>
          <Link href={soldOutHref} title="Mark a dish sold out">
            <Ban className="h-5 w-5" />
            <span className="hidden md:inline">Sold out</span>
          </Link>
        </Button>
        {readyDrawer}
        <BoardControls
          loading={loading}
          onRefresh={onRefresh}
          soundOn={soundOn}
          onToggleSound={onToggleSound}
          wakeLock={wakeLock}
          pwa={pwa}
        />
      </div>
    </header>
  )
}
