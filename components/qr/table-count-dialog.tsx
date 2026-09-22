// components/qr/table-count-dialog.tsx
// How many tables the room has, set from wherever you are looking at the codes rather than only
// from Settings. It is one number that decides how many QR codes there are to print, so asking
// for it in the middle of printing them saves a trip through a form with thirty other fields.
'use client'

import { useId, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateRestaurant } from '@/app/actions/restaurant-actions'
import { FormDialog } from '@/components/forms/form-dialog'
import { PlainField } from '@/components/forms/plain-field'

/** The bounds `restaurantPatch` parses with; the browser refuses the same ones first. */
const MAX_TABLES = 300

interface TableCountDialogProps {
  restaurantId: string
  tableCount: number
  /** The opener, so each page can word its own button. */
  trigger: ReactNode
}

/** Writes `Restaurant.tableCount` through `updateRestaurant`, the same action Settings saves with. */
export default function TableCountDialog({ restaurantId, tableCount, trigger }: TableCountDialogProps) {
  const router = useRouter()
  const field = useId()
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(String(tableCount))

  const save = async () => {
    await updateRestaurant(restaurantId, { tableCount: Number(count) })
    toast.success(Number(count) > 0 ? `${count} tables. The codes are ready to print.` : 'No tables set.')
    router.refresh()
  }

  const parsed = Number(count)
  const valid = count.trim() !== '' && Number.isInteger(parsed) && parsed >= 0 && parsed <= MAX_TABLES

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        // Reopening starts from what is stored, not from what was abandoned last time.
        if (next) setCount(String(tableCount))
        setOpen(next)
      }}
      title="Tables in the room"
      description="One QR code is printed per table, each opening the menu with its own number already filled in. Number them the way the room is numbered."
      submitLabel="Save"
      canSubmit={valid}
      onSubmit={save}
      failure="Could not save that. It must be a whole number of tables, 300 at most."
      trigger={trigger}
    >
      <PlainField
        id={`${field}-tables`}
        label="How many tables"
        type="number"
        min={0}
        max={MAX_TABLES}
        value={count}
        onChange={setCount}
        placeholder="0"
        required
        hint="Set 0 if the room is not numbered; the single menu code still works."
      />
    </FormDialog>
  )
}
