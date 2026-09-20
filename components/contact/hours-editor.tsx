'use client'

import { Copy, Plus, X } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { DAY_KEYS, dayName, type DayKey, type OpeningHours, type Period } from '@/lib/opening-hours'

interface HoursEditorProps {
  value: OpeningHours
  onChange: (next: OpeningHours) => void
  disabled?: boolean
}

const DEFAULT_PERIOD: Period = { open: '12:00', close: '23:00' }

const timeInput =
  'h-9 rounded-md border border-input bg-card px-2 text-sm tnum focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'

export default function HoursEditor({ value, onChange, disabled }: HoursEditorProps) {
  const setDay = (day: DayKey, periods: Period[] | undefined) => {
    const days = { ...value.days }
    if (periods === undefined) delete days[day]
    else days[day] = periods
    onChange({ ...value, days })
  }

  const copyToAll = (day: DayKey) => {
    const src = value.days[day]
    if (src === undefined) return
    const days = { ...value.days }
    for (const d of DAY_KEYS) days[d] = src.map((p) => ({ ...p }))
    onChange({ ...value, days })
  }

  const anySet = DAY_KEYS.some((d) => value.days[d] !== undefined)

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {DAY_KEYS.map((day, i) => {
          const periods = value.days[day]
          const isSet = periods !== undefined
          const isOpen = isSet && periods.length > 0
          return (
            <div
              key={day}
              className={cn(
                'grid grid-cols-[72px_1fr] items-start gap-x-3 gap-y-2 px-3 py-2.5 sm:grid-cols-[88px_auto_1fr_auto] sm:items-center',
                i > 0 && 'border-t border-border',
              )}
            >
              <span className="pt-1.5 text-sm font-medium sm:pt-0">
                <span className="sm:hidden">{dayName(day, 'en')}</span>
                <span className="hidden sm:inline">{dayName(day, 'en', 'long')}</span>
              </span>

              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch
                  checked={isOpen}
                  disabled={disabled}
                  aria-label={`${dayName(day, 'en', 'long')} open`}
                  onCheckedChange={(on) => setDay(day, on ? [{ ...DEFAULT_PERIOD }] : [])}
                />
                <span className="w-12">{isOpen ? 'Open' : isSet ? 'Closed' : 'Not set'}</span>
              </label>

              <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1">
                {isOpen &&
                  periods.map((p, idx) => (
                    <span key={idx} className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={p.open}
                        disabled={disabled}
                        aria-label={`${dayName(day, 'en', 'long')} opens`}
                        onChange={(e) => setDay(day, periods.map((q, j) => (j === idx ? { ...q, open: e.target.value } : q)))}
                        className={timeInput}
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <input
                        type="time"
                        value={p.close}
                        disabled={disabled}
                        aria-label={`${dayName(day, 'en', 'long')} closes`}
                        onChange={(e) => setDay(day, periods.map((q, j) => (j === idx ? { ...q, close: e.target.value } : q)))}
                        className={timeInput}
                      />
                      {periods.length > 1 && (
                        <button
                          type="button"
                          disabled={disabled}
                          aria-label="Remove this period"
                          onClick={() => setDay(day, periods.filter((_, j) => j !== idx))}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                {isOpen && periods.length < 2 && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setDay(day, [...periods, { open: '19:00', close: '23:00' }])}
                    className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Second period
                  </button>
                )}
                {!isSet && <span className="text-xs text-muted-foreground">Turn on to add hours, or leave unset to hide this day.</span>}
              </div>

              <div className="col-start-2 sm:col-start-auto">
                {isSet && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => copyToAll(day)}
                    title="Copy to every day"
                    className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Copy to all</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        A closing time earlier than the opening time means the restaurant stays open past midnight (12:00 to 01:00). Guests see “Open · closes 01:00” or
        “Closed · opens 12:00” on the menu.
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="hours-note" className="text-sm font-medium">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="hours-note"
          value={value.note ?? ''}
          disabled={disabled}
          placeholder={anySet ? 'Kitchen closes 30 minutes before. Closed on public holidays.' : 'Shown instead of a weekly schedule, e.g. “Open every day from noon until late”.'}
          onChange={(e) => onChange({ ...value, note: e.target.value || undefined })}
          className="min-h-[72px]"
        />
      </div>
    </div>
  )
}
