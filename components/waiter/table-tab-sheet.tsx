// components/waiter/table-tab-sheet.tsx
// The table's bill so far, opened from the order screen's header: what was sent when the table
// ordered, each addition since with the time it went in, where each ticket stands with the
// kitchen, and what the whole bill comes to. It answers the guest's "did the wine go through?"
// and the waiter's "what have they already had?" without walking to the pass.
//
// It is also where the bill is worked on: a dish taken off or a ticket cancelled (or asked of the
// kitchen, once it is cooking), the bill merged with another at the same table or moved, and the
// table closed when it has paid. Each of those opens in place of the bill rather than on top of
// it, so the sheet is one screen at a time and Back always returns to the bill.
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { cancelTicket, removeLine } from '@/app/actions/ticket-actions'
import { ReasonPicker, type ReasonChoice } from '@/components/orders/reason-picker'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { changeLabel, staffChange, TICKET_REFUSED } from '@/lib/bill-rules'
import { formatPrice, type Money } from '@/lib/menu'
import { effectiveQuantity } from '@/lib/orders'
import type { TableTab } from '@/lib/table-tab'
import { BillTools } from './bill-tools'
import { CloseBill } from './close-bill'
import { MovePanel } from './move-panel'
import { TabTicket, type TicketTarget } from './tab-ticket'
import { useBillCall } from './use-bill-call'

interface TableTabSheetProps {
  tab: TableTab
  open: boolean
  onOpenChange: (open: boolean) => void
  money: Money
  /** How many tables the room has, for the move's table picker; 0 is a number typed instead. */
  tableCount: number
  /** Read the bill again: after every change made here. */
  onChanged: () => void
}

const CLOCK: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }

/** Which screen the sheet is on: the bill, a reason for taking something off, or the move. */
type View = { kind: 'bill' } | { kind: 'reason'; target: TicketTarget } | { kind: 'move' }

/** What the waiter is told once a change is answered: done, asked, or refused and why. */
function report(result: Awaited<ReturnType<typeof cancelTicket>>, what: string) {
  if (!result.ok) toast.error(TICKET_REFUSED[result.refused])
  else if (result.outcome === 'requested') toast.success(`Asked the kitchen to ${what}`)
  else toast.success(`Done: ${what}`)
}

/** The heading of the reason picker: what is being taken off, and whether the kitchen is asked. */
function reasonTitle(target: TicketTarget): string {
  const mode = staffChange('waiter', target.order.status)
  const direct = mode === 'direct'
  if (target.line === null) return direct ? `Cancel order #${target.order.number}` : `Ask the kitchen to cancel #${target.order.number}`
  return `${changeLabel(direct ? 'direct' : 'request', 'remove')} ${target.line.nameEn}`
}

/**
 * The table's bill: every ticket with what can still be taken off it, the total, merge and move,
 * and "Close table"; a reason is asked for anything taken off.
 */
export function TableTabSheet({ tab, open, onOpenChange, money, tableCount, onChanged }: TableTabSheetProps) {
  const [view, setView] = useState<View>({ kind: 'bill' })
  const { busy, run } = useBillCall(onChanged)
  const at = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', CLOCK)
  const mergedNumbers = new Set(tab.merged.map((merged) => merged.id))
  const openChange = (next: boolean) => {
    if (!next) setView({ kind: 'bill' })
    onOpenChange(next)
  }
  const done = () => openChange(false)

  const takeOff = (target: TicketTarget, choice: ReasonChoice) => {
    const what = target.line === null ? `cancel order #${target.order.number}` : `remove ${choice.quantity} ${target.line.nameEn}`
    const call = () =>
      target.line === null
        ? cancelTicket({ orderId: target.order.id, reason: choice.reason, note: choice.note })
        : removeLine({ lineId: target.line.id, quantity: choice.quantity, reason: choice.reason, note: choice.note })
    return run(call, (result) => {
      report(result, what)
      setView({ kind: 'bill' })
    })
  }

  return (
    <Sheet open={open} onOpenChange={openChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto p-0 sm:rounded-t-sheet">
        <div className="px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <SheetTitle className="text-lg font-semibold">
            Table {tab.parent.table} · Order #{tab.parent.number}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">Everything this table has ordered, and where it stands.</SheetDescription>

          {view.kind === 'reason' && (
            <div className="mt-3">
              <ReasonPicker
                title={reasonTitle(view.target)}
                maxQuantity={view.target.line ? effectiveQuantity(view.target.line) : null}
                busy={busy}
                onPick={(choice) => takeOff(view.target, choice)}
                onBack={() => setView({ kind: 'bill' })}
              />
            </div>
          )}
          {view.kind === 'move' && (
            <div className="mt-3">
              <MovePanel billId={tab.parent.id} number={tab.parent.number} table={tab.parent.table} tableCount={tableCount} busy={busy} run={run} onMoved={done} onBack={() => setView({ kind: 'bill' })} />
            </div>
          )}
          {view.kind === 'bill' && (
            <>
              <ul className="mt-3 flex flex-col gap-3">
                {[tab.parent, ...tab.additions].map((order, index) => (
                  <TabTicket
                    key={order.id}
                    order={order}
                    heading={index === 0 ? `Ordered ${at(order.createdAt)}` : mergedNumbers.has(order.id) ? `Merged from #${order.number}` : `Added ${at(order.createdAt)}`}
                    money={money}
                    answers={tab.answers.filter((answer) => answer.orderId === order.id)}
                    onChange={(target) => setView({ kind: 'reason', target })}
                  />
                ))}
              </ul>

              <div className="tnum mt-4 flex items-center justify-between border-t border-border pt-3 text-[17px] font-semibold">
                <span>Total</span>
                <span>{formatPrice(tab.total, money)}</span>
              </div>

              <BillTools tab={tab} money={money} busy={busy} run={run} onMove={() => setView({ kind: 'move' })} />
              <CloseBill billId={tab.parent.id} table={tab.parent.table} busy={busy} run={run} onClosed={done} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
