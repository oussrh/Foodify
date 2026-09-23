// components/insights/charts/bar-list.tsx
// A ranking as horizontal bars: the name, a bar against the longest, and the value at its tip.
// Every value is written out, so the bar only has to carry the comparison; no tooltip needed.
import { cn } from '@/lib/utils'
import { BG, type Slot } from '@/components/insights/charts/series'

export interface BarRow {
  key: string
  label: string
  value: number
  display: string
  /** A second, quieter figure under the name: `12% ordered`. */
  note?: string
}

interface BarListProps {
  rows: BarRow[]
  slot?: Slot
  /** Said in place of the list when there is nothing to rank. */
  empty: string
  /** The bars' own scale, when the rows are steps of one whole (a funnel) rather than a ranking. */
  max?: number
}

/**
 * A ranking as horizontal bars, each with its value written at the tip; says `empty` when there is
 * nothing to rank.
 */
export function BarList({ rows, slot = 1, empty, max }: BarListProps) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
  const longest = max ?? Math.max(1, ...rows.map((row) => row.value))
  return (
    <ol className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.key} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{row.label}</span>
            <span className="tnum shrink-0 font-medium">{row.display}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div
              className={cn('h-full rounded-full', BG[slot])}
              style={{ width: `${Math.max(row.value > 0 ? 2 : 0, (row.value / longest) * 100)}%` }}
            />
          </div>
          {row.note && <span className="text-xs text-muted-foreground">{row.note}</span>}
        </li>
      ))}
    </ol>
  )
}
