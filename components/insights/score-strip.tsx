// components/insights/score-strip.tsx
// The headline figures of one group, each with how it moved against the window before. The move
// is said three ways — the signed figure, an arrow, a colour for good or bad — so no reader
// depends on the colour; a figure with nothing to compare against says so.
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { Delta } from '@/lib/insights-delta'
import type { Score } from '@/lib/insights-scores'
import { cn } from '@/lib/utils'

const ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus } as const
const TONE = { good: 'text-success', bad: 'text-destructive', neutral: 'text-muted-foreground' } as const

function DeltaLine({ delta, against }: { delta: Delta | null; against: string }) {
  if (!delta) return <span className="text-xs text-muted-foreground">No earlier figure</span>
  const Icon = ICON[delta.direction]
  return (
    <span className="flex items-center gap-1 text-xs">
      <span className={cn('tnum inline-flex items-center gap-0.5 font-medium', TONE[delta.tone])}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {delta.text}
      </span>
      <span className="text-muted-foreground">{against}</span>
    </span>
  )
}

interface ScoreStripProps {
  scores: Score[]
  /** `vs previous 30 days`: what every change here is measured against. */
  against: string
}

/**
 * One group of headline figures, each with its move against the window before said as a figure, an
 * arrow and a colour.
 */
export function ScoreStrip({ scores, against }: ScoreStripProps) {
  const cols = scores.length >= 4 ? 'lg:grid-cols-4' : scores.length === 3 ? 'lg:grid-cols-3' : ''
  return (
    <dl className={cn('grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border', cols)}>
      {scores.map((score) => (
        <div key={score.label} className="flex flex-col gap-1 bg-card px-4 py-3.5 sm:px-5">
          {/* The term first in the DOM, the order a reader hears; the value is shown above it. */}
          <dt className="order-2 text-xs text-muted-foreground">{score.label}</dt>
          <dd className="order-1 text-2xl font-semibold leading-none tracking-display">{score.value}</dd>
          {score.hint && <dd className="order-3 text-xs text-muted-foreground">{score.hint}</dd>}
          <dd className="order-4">
            <DeltaLine delta={score.delta} against={against} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
