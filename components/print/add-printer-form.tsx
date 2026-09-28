// components/print/add-printer-form.tsx
// Adding a printer by name. The rule under the field is the one the action parses with; the
// address the action answers is handed up to be revealed once.
'use client'

import { useId, useState } from 'react'
import { addPrinter } from '@/app/actions/printer-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePosAction } from '@/components/pos/use-pos-action'
import { firstIssue } from '@/lib/schemas/common'
import { printerName } from '@/lib/schemas/print'

/** The name field and Add; `onAdded` receives the new printer's name and its one-time address. */
export function AddPrinterForm({ restaurantId, onAdded }: { restaurantId: string; onAdded: (name: string, token: string) => void }) {
  const fieldId = useId()
  const [name, setName] = useState('')
  const [issue, setIssue] = useState('')
  const { busy, run } = usePosAction()

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const parsed = printerName.safeParse(name)
    setIssue(parsed.success ? '' : firstIssue(parsed.error))
    if (!parsed.success) return
    const outcome = await run(() => addPrinter(restaurantId, parsed.data), 'Printer added')
    if (outcome?.ok && outcome.token) {
      onAdded(parsed.data, outcome.token)
      setName('')
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5" noValidate>
      <Label htmlFor={fieldId}>Add a printer</Label>
      <div className="flex flex-wrap gap-2">
        <Input
          id={fieldId}
          className="h-12 max-w-xs"
          placeholder="Kitchen"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={issue ? true : undefined}
          aria-describedby={`${fieldId}-help`}
        />
        <Button type="submit" className="h-12" disabled={busy}>
          {busy ? 'Adding…' : 'Add'}
        </Button>
      </div>
      <p id={`${fieldId}-help`} className={issue ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
        {issue || 'An Epson network printer with Server Direct Print: TM-m30III, TM-m30II-H or -NT, TM-m50, TM-T88VI or VII, or TM-U220-i. The plain TM-m30II and the TM-T20III cannot.'}
      </p>
    </form>
  )
}
