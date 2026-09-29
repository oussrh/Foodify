// components/pos/location-pick.tsx
// The second screen: signed in, choose where tickets go. The POS's locations are asked for when
// the screen opens (not while the page renders, so a slow till never holds the page), then shown
// as a radio list, with a Test connection button and a way back out.
'use client'

import { useEffect, useState } from 'react'
import { choosePosLocation, listPosLocations, testPos } from '@/app/actions/pos-connect-actions'
import type { PosLocation } from '@/lib/pos/contract'
import type { PosConnectionView } from '@/lib/pos/view'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DisconnectButton } from './disconnect-button'
import { usePosAction } from './use-pos-action'

/** The locations of the signed-in POS, read when the screen opens. */
function useLocations(restaurantId: string) {
  const [locations, setLocations] = useState<PosLocation[] | null>(null)
  const [problem, setProblem] = useState('')
  useEffect(() => {
    let live = true
    listPosLocations(restaurantId)
      .then((answer) => {
        if (!live) return
        if (answer.ok) setLocations(answer.locations)
        else setProblem(answer.error)
      })
      .catch(() => live && setProblem('Could not read the POS’s locations. Try again.'))
    return () => {
      live = false
    }
  }, [restaurantId])
  return { locations, problem }
}

/** The locations of the signed-in POS to choose from, with Test connection and Start over. */
export function LocationPick({ restaurantId, connection }: { restaurantId: string; connection: PosConnectionView }) {
  const [picked, setPicked] = useState(connection.locationId ?? '')
  const { locations, problem } = useLocations(restaurantId)
  const { busy, run } = usePosAction()

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (picked) await run(() => choosePosLocation(restaurantId, { locationId: picked }), 'Location chosen')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where should tickets go?</CardTitle>
        <CardDescription>
          Signed in to {connection.providerName}
          {connection.accountId ? ` (account ${connection.accountId})` : ''}. Choose the location that takes this restaurant’s orders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Location</legend>
            {problem && <p className="text-sm text-destructive">{problem}</p>}
            {!problem && !locations && <p className="text-sm text-muted-foreground">Asking the POS for its locations…</p>}
            {locations?.length === 0 && <p className="text-sm text-muted-foreground">The POS listed no locations. Test the connection, or start over.</p>}
            {locations?.map((location) => (
              <label key={location.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-border px-4 has-[:checked]:border-primary">
                <input type="radio" name="pos-location" value={location.id} checked={picked === location.id} onChange={() => setPicked(location.id)} className="h-5 w-5 accent-primary" />
                <span className="font-medium">{location.name}</span>
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="h-12" disabled={busy || !picked}>
              Continue
            </Button>
            <Button type="button" variant="outline" className="h-12" disabled={busy} onClick={() => void run(() => testPos(restaurantId), 'The POS answered')}>
              Test connection
            </Button>
            <DisconnectButton restaurantId={restaurantId} providerName={connection.providerName} label="Start over" />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
