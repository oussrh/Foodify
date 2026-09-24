// components/waiter/close-bill.tsx
// "Close table", at the foot of the bill: the guests have paid. A close is final (after it only a
// manager's void changes the bill), so it is always asked first: "Close table 4? The bill is paid
// and the table is free for the next party." With dishes still in the kitchen the server answers
// with the count instead, and the question becomes "3 dishes still in the kitchen. Close anyway?".
// A closed bill is never the table's again: the next order starts a new one.
'use client'

import { useState } from 'react'
import { Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { closeBill } from '@/app/actions/bill-actions'
import { Button } from '@/components/ui/button'
import { BILL_REFUSED } from '@/lib/bill-structure'

type CloseResult = Awaited<ReturnType<typeof closeBill>>

interface CloseBillProps {
  billId: string
  table: string
  busy: boolean
  run: <T>(call: () => Promise<T>, done: (result: T) => void) => Promise<void>
  /** The bill is closed: the sheet goes, the table is free. */
  onClosed: () => void
}

/** Where the close stands: not asked yet, asked, or asked again because dishes are still in the kitchen. */
type Asking = { kind: 'idle' } | { kind: 'confirm' } | { kind: 'in_kitchen'; dishes: number }

/** The question and its two answers: the one that closes, and the one that keeps the bill open. */
function Question({ text, confirm, busy, onConfirm, onCancel }: { text: string; confirm: string; busy: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="mt-4 rounded-lg border-2 border-warning p-3" role="alert">
      <p className="text-[15px] font-semibold">{text}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-14 text-[15px]" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button className="h-14 text-[15px]" disabled={busy} onClick={onConfirm}>
          {confirm}
        </Button>
      </div>
    </div>
  )
}

/** The close button, the confirmation it always asks, and "close anyway?" when dishes are still in the kitchen. */
export function CloseBill({ billId, table, busy, run, onClosed }: CloseBillProps) {
  const [asking, setAsking] = useState<Asking>({ kind: 'idle' })

  const close = (force: boolean) =>
    run(
      () => closeBill({ billId, force }),
      (result: CloseResult) => {
        if (result.ok) {
          setAsking({ kind: 'idle' })
          toast.success(`Table ${table} closed`)
          onClosed()
        } else if (result.refused === 'in_kitchen' && 'dishes' in result) setAsking({ kind: 'in_kitchen', dishes: result.dishes })
        else toast.error(BILL_REFUSED[result.refused])
      },
    )
  const cancel = () => setAsking({ kind: 'idle' })

  if (asking.kind === 'confirm') {
    return <Question text={`Close table ${table}? The bill is paid and the table is free for the next party.`} confirm="Close table" busy={busy} onConfirm={() => close(false)} onCancel={cancel} />
  }
  if (asking.kind === 'in_kitchen') {
    const text = `${asking.dishes} ${asking.dishes === 1 ? 'dish' : 'dishes'} still in the kitchen. Close anyway?`
    return <Question text={text} confirm="Close anyway" busy={busy} onConfirm={() => close(true)} onCancel={cancel} />
  }
  return (
    <Button className="mt-4 h-16 w-full gap-2 text-lg" disabled={busy} onClick={() => setAsking({ kind: 'confirm' })}>
      <Receipt className="h-5 w-5" aria-hidden="true" />
      Close table
    </Button>
  )
}
