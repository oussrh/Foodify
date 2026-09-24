// components/waiter/bill-tools.tsx
// What the waiter can do to the whole bill besides closing it: merge it with another bill still
// open at the same table (two parties who turned out to be one), undo such a merge, and move it
// to another table. Merging keeps the earlier bill and makes this one part of it.
'use client'

import { ArrowRightLeft, Merge, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { mergeBills, unmergeBill } from '@/app/actions/bill-actions'
import { Button } from '@/components/ui/button'
import { formatPrice, type Money } from '@/lib/menu'
import { BILL_REFUSED } from '@/lib/bill-structure'
import type { TableTab } from '@/lib/table-tab'

interface BillToolsProps {
  tab: TableTab
  money: Money
  busy: boolean
  run: <T>(call: () => Promise<T>, done: (result: T) => void) => Promise<void>
  onMove: () => void
}

/** Merge with each other open bill at the table, undo each merge, and the way into a move. */
export function BillTools({ tab, money, busy, run, onMove }: BillToolsProps) {
  const merge = (other: TableTab['others'][number]) =>
    run(
      () => mergeBills({ billId: tab.parent.id, intoId: other.id }),
      (result: Awaited<ReturnType<typeof mergeBills>>) => {
        if (result.ok) toast.success(`Order #${tab.parent.number} merged into #${result.intoNumber}`)
        else toast.error(BILL_REFUSED[result.refused])
      },
    )
  const undo = (merged: TableTab['merged'][number]) =>
    run(
      () => unmergeBill({ billId: merged.id }),
      (result: Awaited<ReturnType<typeof unmergeBill>>) => {
        if (result.ok) toast.success(`Order #${result.number} is its own bill again`)
        else toast.error(BILL_REFUSED[result.refused])
      },
    )

  return (
    <div className="mt-4 flex flex-col gap-2">
      {tab.others.map((other) => (
        <Button key={other.id} variant="outline" className="h-14 w-full justify-start gap-2 text-[15px]" disabled={busy} onClick={() => merge(other)}>
          <Merge className="h-5 w-5" aria-hidden="true" />
          Merge with #{other.number}
          <span className="tnum ml-auto text-muted-foreground">{formatPrice(other.total, money)}</span>
        </Button>
      ))}
      {tab.merged.map((merged) => (
        <Button key={merged.id} variant="outline" className="h-14 w-full justify-start gap-2 text-[15px]" disabled={busy} onClick={() => undo(merged)}>
          <Undo2 className="h-5 w-5" aria-hidden="true" />
          Undo merge of #{merged.number}
        </Button>
      ))}
      <Button variant="outline" className="h-14 w-full justify-start gap-2 text-[15px]" disabled={busy} onClick={onMove}>
        <ArrowRightLeft className="h-5 w-5" aria-hidden="true" />
        Move to another table
      </Button>
    </div>
  )
}
