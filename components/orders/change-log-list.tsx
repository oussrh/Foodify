// components/orders/change-log-list.tsx
// What happened to an order after it was sent, for a manager: who cancelled, removed, voided,
// closed, merged or moved what, when and why, and who answered a request (lib/change-log.ts).
// Read when the details open, and again whenever `version` moves (a void made from the sheet).
'use client'

import { useEffect, useState } from 'react'
import { readChangeLog } from '@/app/actions/void-actions'
import { changeAnswer, changeHeadline, changeWhy, type ChangeLogEntry } from '@/lib/change-log'

const CLOCK: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }

/** The order's change log, newest first; "No changes" for an order nobody touched after it was sent. */
export default function ChangeLogList({ orderId, version }: { orderId: string; version: number }) {
  const [entries, setEntries] = useState<ChangeLogEntry[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    readChangeLog({ orderId })
      .then((rows) => {
        if (live) setEntries(rows)
      })
      .catch(() => {
        if (live) setFailed(true)
      })
    return () => {
      live = false
    }
  }, [orderId, version])

  return (
    <section className="mt-5" aria-labelledby={`log-${orderId}`}>
      <h3 id={`log-${orderId}`} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Changes
      </h3>
      {failed && <p className="mt-2 text-sm text-muted-foreground">Could not read the changes.</p>}
      {!failed && entries === null && <p className="mt-2 text-sm text-muted-foreground">Reading…</p>}
      {entries?.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No changes since it was sent.</p>}
      {entries && entries.length > 0 && (
        <ol className="mt-2 flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-md border border-border px-3 py-2 text-sm">
              <p className="font-semibold">{changeHeadline(entry)}</p>
              {changeWhy(entry) && <p>{changeWhy(entry)}</p>}
              <p className="tnum text-[13px] text-muted-foreground">
                {new Date(entry.createdAt).toLocaleTimeString('en-GB', CLOCK)} · {entry.by ?? 'Former staff'}
                {changeAnswer(entry) && ` · ${changeAnswer(entry)}`}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
