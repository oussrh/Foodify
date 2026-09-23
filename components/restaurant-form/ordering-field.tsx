// components/restaurant-form/ordering-field.tsx
// The ordering part of the settings form's General section: the switch that puts the cart on the
// public menu, and how many tables the room has, which is what the Tables tab prints a QR code
// for. The count is kept even while ordering is off, so turning it back on needs no re-typing.
'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface OrderingFieldProps {
  value: boolean
  onChange: (next: boolean) => void
  tableCount: number
  onTableCount: (next: number) => void
}

/**
 * The online-ordering switch and the room's table count, which the Tables tab prints one QR code
 * per table for. The count is clamped to 0-300 and kept while ordering is off.
 */
export default function OrderingField({ value, onChange, tableCount, onTableCount }: OrderingFieldProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Checkbox id="orderingEnabled" checked={value} onCheckedChange={(v) => onChange(v === true)} aria-describedby="orderingEnabled-hint" className="mt-0.5" />
        <div className="space-y-1">
          <Label htmlFor="orderingEnabled" className="cursor-pointer">
            Online ordering
          </Label>
          <p id="orderingEnabled-hint" className="text-xs text-muted-foreground">
            Guests build an order from the menu and send it with their table number. Off, the menu is for reading only.
          </p>
        </div>
      </div>

      <div className="space-y-2 md:max-w-xs">
        <Label htmlFor="tableCount">Tables in the room</Label>
        <Input
          id="tableCount"
          type="number"
          min={0}
          max={300}
          inputMode="numeric"
          value={String(tableCount)}
          onChange={(e) => onTableCount(Math.max(0, Math.min(300, Math.trunc(Number(e.target.value) || 0))))}
          aria-describedby="tableCount-hint"
          className="border-border"
        />
        <p id="tableCount-hint" className="text-xs text-muted-foreground">
          The Tables tab prints one QR code per table; a guest who scans it never types their table number. 0 for none.
        </p>
      </div>
    </div>
  )
}
