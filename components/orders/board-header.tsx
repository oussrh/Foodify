// components/orders/board-header.tsx
// The board's one strip of chrome: where it is, how many orders are open, whether the server is
// answering, and the four switches a tablet needs — install, keep the screen awake, test the
// alert, check now. Every control is at least 48px, because it is pressed with a thumb, often
// with one hand, sometimes with a glove.
'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { ArrowLeft, BellRing, Download, RefreshCw, Sun, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BoardView } from '@/lib/orders'
import { cn } from '@/lib/utils'
import type { OrdersPwa } from './use-orders-pwa'
import type { WakeLock } from './use-wake-lock'

interface BoardHeaderProps {
  restaurantName: string
  view: BoardView
  onView: (view: BoardView) => void
  openCount: number
  online: boolean
  loading: boolean
  onRefresh: () => void
  onTestSound: () => void
  wakeLock: WakeLock
  pwa: OrdersPwa
  /** Absent on a kitchen tablet: there is no portal behind it to go back to. */
  backHref?: Route | undefined
}

const CONTROL = 'h-12 min-w-12 px-3'

export default function BoardHeader({ restaurantName, view, onView, openCount, online, loading, onRefresh, onTestSound, wakeLock, pwa, backHref }: BoardHeaderProps) {
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

        {pwa.canInstall && (
          <Button onClick={pwa.install} className={CONTROL}>
            <Download className="h-5 w-5" />
            <span className="hidden md:inline">Install</span>
          </Button>
        )}

        {wakeLock.supported && (
          <Button
            variant={wakeLock.on ? 'default' : 'outline'}
            onClick={wakeLock.toggle}
            aria-pressed={wakeLock.on}
            className={CONTROL}
            title="Keep the screen awake"
          >
            <Sun className="h-5 w-5" />
            <span className="hidden md:inline">{wakeLock.on ? 'Screen on' : 'Keep awake'}</span>
          </Button>
        )}

        <Button variant="outline" onClick={onTestSound} className={CONTROL} title="Play the new-order alert">
          <BellRing className="h-5 w-5" />
          <span className="hidden md:inline">Test sound</span>
        </Button>

        <Button variant="outline" onClick={onRefresh} aria-label="Check for new orders now" className={CONTROL}>
          <RefreshCw className={cn('h-5 w-5', loading && 'animate-spin')} />
        </Button>
      </div>
    </header>
  )
}
