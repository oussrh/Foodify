// lib/bill-structure.ts
// What may be done to a whole bill: close it once it is paid, merge two bills of one table into
// one, undo that merge, move a bill to another table. Each is checked against the same rule that
// decides a table's open bill (lib/table-tab.ts `addToRefusal`), so a bill that could not be added
// to (cancelled, closed, another restaurant's, an earlier service's) cannot be merged or moved
// either, and a guess at another tenant's id reads as not found. Cancelled means the whole bill:
// every ticket of it, never only the one that opened it. Client-safe.
import { addToRefusal, currentTab, type AddToRefusal, type TabFacts } from '@/lib/table-tab'

/** A bill as these rules read it: the facts of its opening order, and its id. */
export type BillFacts = TabFacts & { id: string }

/** Whose restaurant, and when its current service day began: every rule here is asked inside one. */
export type ServicePlace = { restaurantId: string; serviceStart: Date }

/** Why a bill could not be closed, merged, un-merged or moved. */
export type BillRefusal = AddToRefusal | 'same_bill' | 'same_table' | 'occupied' | 'not_merged'

/** What the waiter is told for each refusal. */
export const BILL_REFUSED: Record<BillRefusal, string> = {
  not_found: 'That order is not one of this restaurant’s',
  other_table: 'Those two orders are at different tables',
  not_a_parent: 'That is part of another order already',
  cancelled: 'That order was cancelled',
  closed: 'That bill is already closed',
  previous_service: 'That order is from an earlier service',
  same_bill: 'That is the same order',
  same_table: 'The order is already at that table',
  occupied: 'That table already has an open order: merge into it instead',
  not_merged: 'That order was not merged, or has been changed since',
}

/**
 * Why `merged` may not become part of `into`, or null when it may: both must be open bills of
 * this restaurant, at `into`'s table, of this service, neither closed nor cancelled.
 */
export function mergeRefusal(into: BillFacts | null, merged: BillFacts | null, place: ServicePlace): BillRefusal | null {
  if (!into) return 'not_found'
  const at = { ...place, table: into.table }
  const refused = addToRefusal(into, at) ?? addToRefusal(merged, at)
  if (refused) return refused
  return merged && merged.id === into.id ? 'same_bill' : null
}

/**
 * Why `bill` may not move to `toTable`, or null when it may: it must be an open bill of this
 * service, and the table must be another one. Whether the target has a bill of its own is
 * `landingBill`'s question, asked after this.
 */
export function moveRefusal(bill: BillFacts | null, place: ServicePlace, toTable: string): BillRefusal | null {
  if (!bill) return 'not_found'
  const refused = addToRefusal(bill, { ...place, table: bill.table })
  if (refused) return refused
  return bill.table === toTable ? 'same_table' : null
}

/** The open bill at `toTable` a moved bill would land on, among that table's bills: the table's current one, or null. */
export function landingBill<T extends BillFacts>(bills: readonly T[], place: ServicePlace, toTable: string): T | null {
  return currentTab(bills, { ...place, table: toTable })
}

/**
 * Why a merge of `merged` into `into` cannot be undone, or null when it can: the merge must be on
 * record and still be how the bills stand (`merged` is still part of `into`, and `into` is still a
 * bill of its own), neither bill may have been closed since, and the surviving bill must not have
 * been merged or moved since (`changedSince`): an undo puts back the bills as they were, and after
 * a later change there is no "as they were" to put back.
 */
export function unmergeRefusal(
  merged: { parentId: string | null; closedAt: Date | string | null } | null,
  into: { id: string; parentId: string | null; closedAt: Date | string | null } | null,
  record: { changedSince: boolean } | null,
): BillRefusal | null {
  if (!merged || !into || !record || merged.parentId !== into.id || into.parentId !== null || record.changedSince) return 'not_merged'
  return merged.closedAt !== null || into.closedAt !== null ? 'closed' : null
}

/**
 * Why a bill cannot be closed, or null when it can: it must be a bill (not an addition), not
 * cancelled as a whole and not already closed. Of any service: an old bill nobody closed can still be.
 */
export function closeRefusal(bill: { parentId: string | null; cancelled: boolean; closedAt: Date | string | null } | null): BillRefusal | null {
  if (!bill) return 'not_found'
  if (bill.parentId !== null) return 'not_a_parent'
  if (bill.cancelled) return 'cancelled'
  return bill.closedAt !== null ? 'closed' : null
}
