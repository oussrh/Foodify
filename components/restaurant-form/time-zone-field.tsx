// components/restaurant-form/time-zone-field.tsx
// Where the restaurant is, as its clock: the zone its sold-out dishes come back in (its own 04:00)
// and that Insights cuts its days and hours in. A native select over every zone the browser knows,
// each with its offset today, because a manager recognises "GMT+1" faster than a city name.
'use client'

import { useMemo } from 'react'
import type { UseFormRegister } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { timeZoneLabel, timeZones } from '@/lib/time-zone'
import type { EditRestaurantValues } from '@/components/restaurant-form/edit-restaurant-schema'

const SELECT =
  'flex h-10 w-full rounded-sm border border-border bg-background px-3 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring md:max-w-md'

/** The restaurant's time zone: its sold-out dishes return at its own 04:00, and Insights reads its days and hours in it. */
export default function TimeZoneField({ register }: { register: UseFormRegister<EditRestaurantValues> }) {
  const options = useMemo(() => timeZones().map((zone) => ({ zone, label: timeZoneLabel(zone) })), [])
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
