// components/waiter/move-panel.tsx
// Moving the table's bill to another table: the room's tables as large buttons (or a number typed
// when the restaurant has not said how many it has). A table that already has an open bill is
// refused with that bill named, and the one thing to do instead is offered in its place: move
// and merge into it, as one change.
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { moveBill } from '@/app/actions/bill-actions'
import { PanelBack } from '@/components/orders/panel-back'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BILL_REFUSED } from '@/lib/bill-structure'

interface MovePanelProps {
  billId: string
  number: number
  table: string
  tableCount: number
  busy: boolean
  run: <T>(call: () => Promise<T>, done: (result: T) => void) => Promise<void>
  /** The bill left this table. */
  onMoved: () => void
  onBack: () => void
}

type MoveResult = Awaited<ReturnType<typeof moveBill>>

/** The tables the bill may go to: every table of the room but its own. */
const otherTables = (count: number, own: string) => Array.from({ length: count }, (_, i) => String(i + 1)).filter((table) => table !== own)

/** The table picker for a move, and the "move and merge" offer when the table chosen is taken. */
export function MovePanel({ billId, number, table, tableCount, busy, run, onMoved, onBack }: MovePanelProps) {
  const [occupied, setOccupied] = useState<{ table: string; bill: { id: string; number: number } } | null>(null)
  const [typed, setTyped] = useState('')

  const move = (to: string, mergeInto?: string) =>
    run(
      () => moveBill({ billId, table: to, mergeInto }),
      (result: MoveResult) => {
        if (result.ok) {
          toast.success(result.mergedInto === null ? `Order #${number} moved to table ${to}` : `Moved to table ${to} and merged into #${result.mergedInto}`)
          onMoved()
        } else if (result.refused === 'occupied' && 'openBill' in result) setOccupied({ table: to, bill: result.openBill })
        else toast.error(BILL_REFUSED[result.refused])
      },
    )

  return (
    <div>
      <PanelBack title={`Move order #${number} to another table`} onBack={onBack} busy={busy} />

      {occupied ? (
        <div className="mt-3 rounded-lg border border-warning p-3" role="alert">
          <p className="text-[15px] font-semibold">
            Table {occupied.table} already has order #{occupied.bill.number} open.
          </p>
          <Button className="mt-3 h-14 w-full text-[15px]" disabled={busy} onClick={() => move(occupied.table, occupied.bill.id)}>
            Move and merge into #{occupied.bill.number}
          </Button>
          <Button variant="outline" className="mt-2 h-12 w-full text-[15px]" disabled={busy} onClick={() => setOccupied(null)}>
            Choose another table
          </Button>
        </div>
      ) : tableCount > 0 ? (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {otherTables(tableCount, table).map((option) => (
            <Button key={option} variant="outline" className="h-14 text-lg font-semibold" disabled={busy} onClick={() => move(option)} aria-label={`Move to table ${option}`}>
              {option}
            </Button>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <Label htmlFor="move-table" className="block text-sm font-medium">
            Table number
          </Label>
          <Input id="move-table" value={typed} onChange={(event) => setTyped(event.target.value)} inputMode="numeric" maxLength={20} className="mt-1 h-12 text-base" />
          <Button className="mt-3 h-14 w-full text-[15px]" disabled={busy || typed.trim() === '' || typed.trim() === table} onClick={() => move(typed.trim())}>
            Move
          </Button>
        </div>
      )}
    </div>
  )
}
