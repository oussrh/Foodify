// components/menu/cart/table-field.tsx
// Where the order goes. A guest who scanned the table's own QR code has already told us: the
// number is shown, not asked for (nothing to mistype, nothing to send to the wrong table).
// Anyone who opened the menu another way types it.
'use client'

import { QrCode } from 'lucide-react'
import { MENU_TEXT, type Locale } from '@/lib/menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TableFieldProps {
  table: string
  onTable: (table: string) => void
  /** The QR code carried the table: show it instead of asking. */
  locked: boolean
  /** The guest tried to send without a table. */
  invalid: boolean
  locale: Locale
}

export default function TableField({ table, onTable, locked, invalid, locale }: TableFieldProps) {
  const t = MENU_TEXT[locale]

  if (locked) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
        <QrCode className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-[13px] text-muted-foreground">{t.tableNumber}</p>
          <p className="tnum text-[15px] font-semibold">{table}</p>
        </div>
        <p className="ml-auto text-right text-xs text-muted-foreground">{t.tableFromQr}</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="cart-table">{t.tableNumber}</Label>
      <Input
        id="cart-table"
        value={table}
        onChange={(e) => onTable(e.target.value)}
        inputMode="numeric"
        autoComplete="off"
        maxLength={20}
        required
        aria-invalid={invalid ? true : undefined}
        aria-describedby="cart-table-hint"
        className="h-12 text-base"
      />
      <p id="cart-table-hint" className="text-xs text-muted-foreground">
        {t.tableHint}
      </p>
    </div>
  )
}
