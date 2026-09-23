// components/restaurant-form/time-zone-field.tsx
// Where the restaurant is, as its clock: the zone its sold-out dishes come back in (its own 04:00)
// and that Insights cuts its days and hours in. A native select over every zone the browser knows,
// each with its offset today, because a manager recognises "GMT+1" faster than a city name.
//
// The list is built in the browser only. The server's Node and the browser each carry their own
// time-zone data: they can know different zones (a renamed city) and write an offset differently
// ("GMT" and "GMT+0"), and either difference is a hydration error. So the server, and the first
// client render, show the saved zone alone; the full list replaces it once the page is live.
'use client'

import { useSyncExternalStore } from 'react'
import type { UseFormRegister } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { timeZoneLabel, timeZones } from '@/lib/time-zone'
import type { EditRestaurantValues } from '@/components/restaurant-form/edit-restaurant-schema'

const SELECT =
  'flex h-10 w-full rounded-sm border border-border bg-background px-3 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring md:max-w-md'

type Option = { zone: string; label: string }

// Built once per page and kept, so the snapshot is the same object on every read (React compares it).
let browserOptions: Option[] | null = null
const allZones = () => (browserOptions ??= timeZones().map((zone) => ({ zone, label: timeZoneLabel(zone) })))
const noSubscription = () => () => {}

/** The restaurant's time zone: its sold-out dishes return at its own 04:00, and Insights reads its days and hours in it. */
export default function TimeZoneField({ register, current }: { register: UseFormRegister<EditRestaurantValues>; current: string }) {
  const zones = useSyncExternalStore<Option[] | null>(noSubscription, allZones, () => null)
  const options = zones ?? [{ zone: current, label: current.replaceAll('_', ' ') }]
  return (
    <div className="space-y-2">
      <Label htmlFor="timeZone">Time zone</Label>
      <select id="timeZone" className={SELECT} aria-describedby="timeZone-hint" {...register('timeZone')}>
        {options.map(({ zone, label }) => (
          <option key={zone} value={zone}>
            {label}
          </option>
        ))}
      </select>
      <p id="timeZone-hint" className="text-xs text-muted-foreground">
        Sold-out dishes come back at 04:00 here, and Insights counts its days and busy hours in this time.
      </p>
    </div>
  )
}
