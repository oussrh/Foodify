import Link from 'next/link'
import type { Route } from 'next'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  /** Optional link rendered above the title, e.g. back to the list */
  back?: { href: Route; label: string }
  actions?: React.ReactNode
  className?: string
}

/**
 * A portal page's title, its one-line description, an optional link back above it, and the page's
 * actions on the right.
 */
export function PageHeader({ title, description, back, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-display">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

interface Stat {
  label: string
  value: string | number
  hint?: string | undefined
}

/** Four-up (or fewer) numbers in one hairline strip. Only put figures here that exist. */
export function StatStrip({ stats, className }: { stats: Stat[]; className?: string }) {
  const cols = stats.length >= 4 ? 'md:grid-cols-4' : stats.length === 3 ? 'md:grid-cols-3' : ''
  return (
    <dl className={cn('grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border', cols, className)}>
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col gap-0.5 bg-card px-4 py-3.5 sm:px-5">
          {/* The term comes first in the DOM (a definition list's order, what a reader hears); the value is shown above it. */}
          <dt className="order-2 text-xs text-muted-foreground">{s.label}</dt>
          <dd className="tnum order-1 text-2xl font-semibold leading-none tracking-display">{s.value}</dd>
          {s.hint && <dd className="order-3 text-xs text-success">{s.hint}</dd>}
        </div>
      ))}
    </dl>
  )
}

interface EmptyStateProps {
  title: string
  description?: string | undefined
  action?: React.ReactNode
}

/** What a list says when it has nothing in it, with the one action that would fill it. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong px-6 py-14 text-center">
      <p className="text-base font-semibold">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
