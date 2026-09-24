// components/waiter/bill-choice.tsx
// Which bill a send goes to, said under the send button: the table's open one or a new one, with
// the other a tap away; or, when the table could not be checked, that it could not, with a retry,
// so a waiter never opens a second bill for a table without knowing it.
'use client'

import { Button } from '@/components/ui/button'

/** Where the waiter's send is going, as the review sheet shows it. */
export type BillChoice =
  | { kind: 'checking' }
  | { kind: 'failed' }
  | { kind: 'none' }
  | { kind: 'open'; number: number; adding: boolean }

/**
 * Where a send goes, from the read of the table's bill and the waiter's own choice (null for the
 * default, `addByDefault`): the choice to show, and the bill to name in `addTo` when adding. A
 * table not yet checked, or not checkable, never adds.
 */
export function billChoice(
  read: { status: 'checking' | 'ready' | 'failed'; tab: { parent: { id: string; number: number }; addByDefault: boolean } | null },
  choice: 'add' | 'new' | null,
): { bill: BillChoice; addTo: string | null } {
  if (read.status !== 'ready') return { bill: { kind: read.status }, addTo: null }
  if (!read.tab) return { bill: { kind: 'none' }, addTo: null }
  const adding = (choice ?? (read.tab.addByDefault ? 'add' : 'new')) === 'add'
  return { bill: { kind: 'open', number: read.tab.parent.number, adding }, addTo: adding ? read.tab.parent.id : null }
}

/** What the send button says for a choice: where this order is going. */
export function sendLabel(bill: BillChoice): string {
  if (bill.kind === 'checking') return 'Checking the table…'
  if (bill.kind === 'none') return 'Send to the kitchen'
  if (bill.kind === 'open' && bill.adding) return `Add to order #${bill.number}`
  return 'Send as a new order'
}

interface BillSwitchProps {
  bill: BillChoice
  onAddingChange: (adding: boolean) => void
  onRetry: () => void
}

/** The line under the send button: the one-tap switch between the table's bill and a new one, or the failed check and its retry. */
export function BillSwitch({ bill, onAddingChange, onRetry }: BillSwitchProps) {
  if (bill.kind === 'failed') {
    return (
      <div className="mt-2 flex items-center gap-2">
        <p role="alert" className="flex-1 text-sm text-muted-foreground">
          Could not check this table’s order.
        </p>
        <Button variant="outline" className="h-12 px-4" onClick={onRetry}>
          Retry
        </Button>
      </div>
    )
  }
  if (bill.kind !== 'open') return null
  return (
    <button
      type="button"
      onClick={() => onAddingChange(!bill.adding)}
      className="mt-1 h-12 w-full text-sm font-medium text-muted-foreground underline underline-offset-2"
    >
      {bill.adding ? 'Start a new order instead' : `Add to order #${bill.number} instead`}
    </button>
  )
}
