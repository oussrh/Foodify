// components/waiter/table-tile.tsx
// One table in the room, sized to be hit while walking. Three states and each is legible from
// arm's length without reading a word: free is quiet, cooking is outlined, ready is filled and
// says so. Colour is never the only carrier — the ready tile also changes its wording and its
// icon — because a dining room is dim and a phone is often at an angle.
'use client'

import { Bell, Clock } from 'lucide-react'
import { STATUS_LABEL } from '@/lib/orders'
import type { TableTile as Tile } from '@/lib/waiter-floor'
import { cn } from '@/lib/utils'

interface TableTileProps {
  tile: Tile
  onOpen: () => void
  /** True for a few seconds after this table's food came up, so the eye is drawn to it. */
  flashing: boolean
}

/** Plural without a library: these are counts of orders and items, never anything else. */
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** What a screen reader is told, which is the same fact the tile shows rather than a description of it. */
function tileLabel(tile: Tile): string {
  if (tile.state === 'ready') return `Table ${tile.table}, ${plural(tile.ready.length, 'order')} ready to carry out`
  if (tile.state === 'cooking') {
    const stage = tile.stage ? STATUS_LABEL[tile.stage].toLowerCase() : 'with the kitchen'
    return `Table ${tile.table}, ${stage}, ${plural(tile.items, 'item')}, waiting ${tile.waitingMinutes} minutes`
  }
  return `Table ${tile.table}, free`
}

/** One table in the room (free, cooking or ready), legible from arm's length and never by colour alone. */
export function TableTile({ tile, onOpen, flashing }: TableTileProps) {
  const { table, state, ready, items, waitingMinutes } = tile

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={tileLabel(tile)}
      className={cn(
        'flex h-32 w-full flex-col items-start justify-between rounded-lg border-2 p-3 text-left transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
        state === 'ready' && 'border-success bg-success text-white',
        state === 'cooking' && 'border-brand bg-card',
        state === 'free' && 'border-border bg-card',
        // Honours prefers-reduced-motion through the global rule in globals.css.
        flashing && 'animate-pulse',
      )}
    >
      <span className="flex w-full items-start justify-between gap-2">
        <span className="text-3xl font-semibold leading-none tracking-display">{table}</span>
        {state === 'ready' && <Bell className="h-6 w-6 shrink-0" aria-hidden="true" />}
      </span>

      {state === 'free' && <span className="text-[13px] opacity-70">Free</span>}

      {state === 'cooking' && (
        <span className="w-full text-[13px] leading-tight text-muted-foreground">
          {/* Which stage, not just "busy": a waiter wants to know whether the kitchen has started. */}
          <span className="block truncate text-base font-bold text-foreground">
            {tile.stage ? STATUS_LABEL[tile.stage] : 'With the kitchen'}
          </span>
          <span className="tnum flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {waitingMinutes} min · {plural(items, 'item')}
          </span>
        </span>
      )}

      {state === 'ready' && (
        <span className="w-full text-[13px] leading-tight">
          <span className="block text-base font-bold">{STATUS_LABEL.READY}</span>
          <span className="tnum opacity-90">{plural(ready.length, 'order')} to carry</span>
        </span>
      )}
    </button>
  )
}
