// components/capture/mode-choice.tsx
// How the dish is filmed, asked first because the advice under it depends on it: the phone walks
// round a still plate, or the plate turns in front of a still phone. The engine reconstructs the two
// differently, so a video filmed one way and sent as the other fails, with a message saying so.
'use client'

import type { CaptureMode } from '@/lib/schemas/capture'

type Props = {
  name: string
  value: CaptureMode
  onChange: (value: CaptureMode) => void
}

const OPTIONS: { value: CaptureMode; label: string; hint: string }[] = [
  { value: 'WALKAROUND', label: 'I walk around the dish', hint: 'The plate stays still on a patterned placemat.' },
  { value: 'TURNTABLE', label: 'The plate turns', hint: 'On a turntable, in front of a phone that stays still.' },
]

/** Two radio options in a fieldset, each with what it means. */
export function ModeChoice({ name, value, onChange }: Props) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">How are you filming?</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((option) => (
          <label key={option.value} htmlFor={`${name}-${option.value}`} className="grid min-h-11 grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-sm border p-3 text-sm has-[:checked]:border-primary">
            <input id={`${name}-${option.value}`} type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="row-span-2 mt-0.5 h-4 w-4 accent-primary" />
            <span className="font-medium">{option.label}</span>
            <span className="text-muted-foreground">{option.hint}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
