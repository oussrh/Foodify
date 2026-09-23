// components/insights/grain-tabs.tsx
// Daily / Weekly / Monthly / Yearly. Links rather than state: the grain is in the URL, so a
// report someone is looking at is a report they can send, and the page reads it on the server
// where the query is.
import Link from 'next/link'
import type { Route } from 'next'
import { cn } from '@/lib/utils'
import { GRAINS, GRAIN_LABEL, type Grain } from '@/lib/insights'

interface GrainTabsProps {
  /** The tab's own path, without the query. */
  basePath: string
  current: Grain
}

/**
 * Daily / Weekly / Monthly / Yearly as links: the grain lives in the URL, so a report on screen is
 * a report that can be sent.
 */
export function GrainTabs({ basePath, current }: GrainTabsProps) {
  return (
    <div className="flex gap-1 rounded-md border border-border bg-card p-1" role="group" aria-label="Report period">
      {GRAINS.map((grain) => {
        const active = grain === current
        return (
          <Link
            key={grain}
            href={`${basePath}?grain=${grain}` as Route}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'h-8 flex-1 rounded-sm px-3 text-center text-[13px] font-medium leading-8 transition-colors',
              active ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {GRAIN_LABEL[grain]}
          </Link>
        )
      })}
    </div>
  )
}
