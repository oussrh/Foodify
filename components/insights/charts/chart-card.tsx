// components/insights/charts/chart-card.tsx
// The frame every chart on the Insights tab sits in: a hairline card, a title that says what is
// plotted, one line on how to read it, and — for two series or more — a legend, so identity is
// never carried by colour alone.
import { cn } from '@/lib/utils'
import { BG, type Slot } from '@/components/insights/charts/series'

interface LegendItem {
  label: string
  slot: Slot
  /** A line series gets a short stroke for a key; a column series a square. */
  line?: boolean
}

export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn(item.line ? 'h-0.5 w-3 rounded-full' : 'h-2.5 w-2.5 rounded-[2px]', BG[item.slot])}
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

interface ChartCardProps {
  title: string
  description?: string
  legend?: LegendItem[]
  className?: string
  children: React.ReactNode
}

export function ChartCard({ title, description, legend, className, children }: ChartCardProps) {
  return (
    <section className={cn('flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:p-5', className)}>
      <header className="flex flex-col gap-2">
        <div>
          <h3 className="text-base font-semibold tracking-display">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {legend && legend.length > 1 && <Legend items={legend} />}
      </header>
      {children}
    </section>
  )
}
