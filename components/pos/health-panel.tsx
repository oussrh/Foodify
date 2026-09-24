// components/pos/health-panel.tsx
// A connected POS at a glance: its state, where tickets go, when it last took something, the
// queue counted by state, the last thing that went wrong in plain words, menu changes the POS
// reported for review, and the switches: Retry now, Pause or Resume (asking what becomes of the
// events that waited), Test connection, review the matches, Disconnect.
'use client'

import { useState } from 'react'
import { testPos } from '@/app/actions/pos-connect-actions'
import { pausePos, retryPosNow } from '@/app/actions/pos-control-actions'
import { POS_STATUS_LABEL } from '@/lib/pos/status'
import type { PosConnectionView } from '@/lib/pos/view'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DisconnectButton } from './disconnect-button'
import { HealthStats } from './health-stats'
import { MappingCard } from './mapping-card'
import { ResumeControls } from './resume-controls'
import { usePosAction } from './use-pos-action'

const STATUS_BADGE = { ACTIVE: 'success', PAUSED: 'warning', ERROR: 'destructive' } as const

/** The health panel of a set-up connection; the matching screen replaces it while the matches are reviewed. */
export function HealthPanel({ restaurantId, connection }: { restaurantId: string; connection: PosConnectionView }) {
  const [reviewing, setReviewing] = useState(false)
  const { busy, run } = usePosAction()
  if (reviewing) return <MappingCard restaurantId={restaurantId} activate={false} onDone={() => setReviewing(false)} />
  const variant = connection.status in STATUS_BADGE ? STATUS_BADGE[connection.status as keyof typeof STATUS_BADGE] : 'outline'

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{connection.providerName}</CardTitle>
          <Badge variant={variant}>{POS_STATUS_LABEL[connection.status]}</Badge>
        </div>
        <CardDescription>
          Tickets go to {connection.locationName ?? connection.locationId ?? 'no location yet'}. {connection.mapped} of {connection.dishes} dishes matched.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <HealthStats connection={connection} />
        {connection.lastError && (
          <p className="rounded-md border border-destructive/40 px-4 py-3 text-sm">
            <span className="font-medium">Last problem: </span>
            {connection.lastError}
          </p>
        )}
        {connection.menuChanges > 0 && (
          <p className="rounded-md border border-warning/40 px-4 py-3 text-sm">
            The POS reported {connection.menuChanges === 1 ? 'a change' : `${connection.menuChanges} changes`} to its menu. Review your matches.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button className="h-12" disabled={busy} onClick={() => void run(() => retryPosNow(restaurantId), 'Sent what was due')}>
            Retry now
          </Button>
          {connection.status === 'ACTIVE' && (
            <Button variant="outline" className="h-12" disabled={busy} onClick={() => void run(() => pausePos(restaurantId), 'Paused')}>
              Pause
            </Button>
          )}
          {connection.status === 'PAUSED' && <ResumeControls restaurantId={restaurantId} waiting={connection.counts.pending} />}
          <Button variant="outline" className="h-12" disabled={busy} onClick={() => void run(() => testPos(restaurantId), 'The POS answered')}>
            Test connection
          </Button>
          <Button variant="outline" className="h-12" disabled={busy} onClick={() => setReviewing(true)}>
            Review matches
          </Button>
          <DisconnectButton restaurantId={restaurantId} providerName={connection.providerName} />
        </div>
      </CardContent>
    </Card>
  )
}
