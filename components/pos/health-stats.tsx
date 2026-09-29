// components/pos/health-stats.tsx
// The queue in four numbers and the last time the POS took something.
import type { PosConnectionView } from '@/lib/pos/view'

const WHEN: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }

/** Sent, waiting, failed and refused, and the last sync. */
export function HealthStats({ connection }: { connection: PosConnectionView }) {
  const stats = [
    { label: 'Sent', value: connection.counts.sent },
    { label: 'Waiting', value: connection.counts.pending },
    { label: 'Failed', value: connection.counts.failed },
    { label: 'Refused', value: connection.counts.refused },
  ]
  return (
    <div className="flex flex-col gap-2">
      <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-md border border-border px-4 py-3">
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="tnum text-xl font-semibold" data-testid={`pos-${stat.label.toLowerCase()}`}>
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted-foreground">
        {connection.lastSyncAt ? `Last taken by the POS ${new Date(connection.lastSyncAt).toLocaleString('en-GB', WHEN)}` : 'Nothing sent yet'}
        {connection.counts.discarded > 0 && ` · ${connection.counts.discarded} discarded, never sent`}
      </p>
    </div>
  )
}
