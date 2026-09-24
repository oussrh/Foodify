// components/orders/details-lines.tsx
// An order's lines at full size, as its details sheet shows them: what is left of each dish, what
// came off it ("−1 Tea", struck through once nothing is left), both names, and the guest's note.
// A manager also gets a Void on each line that still has something left.
'use client'

import { Button } from '@/components/ui/button'
import { effectiveQuantity, type BoardLine } from '@/lib/orders'
import { cn } from '@/lib/utils'

interface DetailsLinesProps {
  lines: BoardLine[]
  /** A manager's void of one line; absent for everybody else, and no button is drawn. */
  onVoid?: ((line: BoardLine) => void) | undefined
}

/** Every line of an order in full, with what came off it; a Void per line for a manager. */
export default function DetailsLines({ lines, onVoid }: DetailsLinesProps) {
  return (
    <ul className="mt-4 flex flex-col divide-y divide-border border-y border-border">
      {lines.map((line) => {
        const left = effectiveQuantity(line)
        return (
          <li key={line.id} className="flex items-center gap-3 py-3">
            <span className={cn('tnum min-w-[2.5ch] self-baseline text-xl font-semibold', left === 0 && 'text-muted-foreground line-through')}>{left || line.quantity}×</span>
            <span className="min-w-0 flex-1">
              <span className={cn('block text-[17px] leading-snug', left === 0 && 'text-muted-foreground line-through')}>{line.nameEn}</span>
              <span className="block text-[13px] text-muted-foreground">{line.nameFr}</span>
              {line.removedQuantity > 0 && (
                <span className="mt-1 block text-[15px] font-bold text-destructive">
                  −{line.removedQuantity} {line.nameEn}
                </span>
              )}
              {line.note && <span className="mt-1 block text-[15px] font-semibold text-warning">{line.note}</span>}
            </span>
            {onVoid && left > 0 && (
              <Button variant="outline" className="h-12 shrink-0 px-4" onClick={() => onVoid(line)} aria-label={`Void ${line.nameEn}`}>
                Void
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
