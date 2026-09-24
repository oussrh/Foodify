// components/orders/reason-picker.tsx
// Why a dish or a ticket is coming off, picked in one tap: the short list of reasons as large
// buttons, "Other" opening a note, and above them how many portions when the line has more than
// one. Shared by the waiter's phone (remove, cancel, ask the kitchen) and a manager's void, so the
// floor and the office give the kitchen the same reasons. The note is checked by the schema the
// action parses with (lib/schemas/order-changes.ts).
'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CHANGE_REASONS, MAX_CHANGE_NOTE, REASON_LABEL, type ChangeReason } from '@/lib/bill-rules'
import { changeReason } from '@/lib/schemas/order-changes'
import { PanelBack } from './panel-back'

/** What the picker hands back: the reason, the note for "Other", and how many portions. */
export type ReasonChoice = { reason: ChangeReason; note?: string; quantity: number }

interface ReasonPickerProps {
  /** What is being done, as the heading says it: "Remove Tea", "Ask the kitchen to cancel #12". */
  title: string
  /** How many portions may come off; 1 or null (a whole ticket) shows no stepper. */
  maxQuantity: number | null
  busy: boolean
  onPick: (choice: ReasonChoice) => void
  onBack: () => void
}

/** The portions stepper, thumb-sized, for a line with more than one left. */
function QuantityStepper({ value, max, onChange }: { value: number; max: number; onChange: (value: number) => void }) {
  return (
    <div className="mt-3 flex items-center gap-3">
      <span className="flex-1 text-[15px] font-medium">How many</span>
      <Button variant="outline" size="icon" className="h-12 w-12" disabled={value <= 1} onClick={() => onChange(value - 1)} aria-label="One fewer">
        <Minus className="h-4 w-4" />
      </Button>
      <output className="tnum w-8 text-center text-xl font-semibold" aria-live="polite">
        {value}
      </output>
      <Button variant="outline" size="icon" className="h-12 w-12" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="One more">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}

/**
 * One tap per reason; "Other" asks for a short note first. With `maxQuantity` above one, a
 * stepper says how many portions come off (one by default).
 */
export function ReasonPicker({ title, maxQuantity, busy, onPick, onBack }: ReasonPickerProps) {
  const [quantity, setQuantity] = useState(1)
  const [other, setOther] = useState(false)
  const [note, setNote] = useState('')
  const noteOk = changeReason.safeParse({ reason: 'other', note }).success

  return (
    <div>
      <PanelBack title={title} onBack={onBack} busy={busy} />
      {maxQuantity !== null && maxQuantity > 1 && <QuantityStepper value={quantity} max={maxQuantity} onChange={setQuantity} />}

      <p className="mt-4 text-sm font-medium text-muted-foreground">Why?</p>
      <div className="mt-2 flex flex-col gap-2">
        {CHANGE_REASONS.filter((reason) => reason !== 'other').map((reason) => (
          <Button key={reason} variant="outline" className="h-14 w-full justify-start text-[15px]" disabled={busy} onClick={() => onPick({ reason, quantity })}>
            {REASON_LABEL[reason]}
          </Button>
        ))}
        <Button variant={other ? 'secondary' : 'outline'} className="h-14 w-full justify-start text-[15px]" disabled={busy} onClick={() => setOther(true)} aria-expanded={other}>
          {REASON_LABEL.other}
        </Button>
      </div>

      {other && (
        <div className="mt-3">
          <Label htmlFor="change-note" className="block text-sm font-medium">
            Say why
          </Label>
          <Input id="change-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={MAX_CHANGE_NOTE} className="mt-1 h-12" placeholder="A few words for the record" />
          <Button className="mt-3 h-14 w-full text-[15px]" disabled={busy || !noteOk} onClick={() => onPick({ reason: 'other', note: note.trim(), quantity })}>
            {busy ? 'Sending…' : 'Send'}
          </Button>
        </div>
      )}
    </div>
  )
}
