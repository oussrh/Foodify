// components/print/trigger-choice.tsx
// When a kitchen ticket prints, chosen once for the restaurant and saved as it is chosen: on
// arrival (the paper is the kitchen's call) or on accept (an order from a guest's phone is looked
// at on the board first).
'use client'

import { useState } from 'react'
import { setPrintTrigger } from '@/app/actions/printer-actions'
import type { PrintTriggerInput } from '@/lib/schemas/print'
import { usePosAction } from '@/components/pos/use-pos-action'

const CHOICES: { value: PrintTriggerInput; label: string; hint: string }[] = [
  { value: 'ARRIVAL', label: 'As soon as an order arrives', hint: 'The ticket is the kitchen’s call: it prints the moment the order is sent.' },
  { value: 'ACCEPT', label: 'When the kitchen accepts it', hint: 'Orders wait on the board; the ticket prints when someone taps Accept.' },
]

/** The two moments a ticket can print at, as a radio group that saves on change. */
export function TriggerChoice({ restaurantId, trigger }: { restaurantId: string; trigger: PrintTriggerInput }) {
  const [value, setValue] = useState(trigger)
  const { busy, run } = usePosAction()

  const choose = async (next: PrintTriggerInput) => {
    const previous = value
    setValue(next)
    const outcome = await run(() => setPrintTrigger(restaurantId, next), 'Saved')
    if (!outcome?.ok) setValue(previous)
  }

  return (
    <fieldset className="flex flex-col gap-2" disabled={busy}>
      <legend className="mb-2 text-sm font-medium">Print a ticket</legend>
      {CHOICES.map((choice) => (
        <div key={choice.value} className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 has-[:checked]:border-primary">
          <input
            type="radio"
            id={`printTrigger-${choice.value}`}
            name="printTrigger"
            value={choice.value}
            checked={value === choice.value}
            onChange={() => void choose(choice.value)}
            aria-describedby={`printTrigger-${choice.value}-hint`}
            className="mt-1 h-4 w-4 accent-primary"
          />
          <div className="flex flex-col gap-0.5">
            <label htmlFor={`printTrigger-${choice.value}`} className="cursor-pointer text-sm font-medium">
              {choice.label}
            </label>
            <span id={`printTrigger-${choice.value}-hint`} className="text-xs text-muted-foreground">
              {choice.hint}
            </span>
          </div>
        </div>
      ))}
    </fieldset>
  )
}
