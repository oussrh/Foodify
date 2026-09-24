// app/actions/bill-actions.ts
// What the floor does to a whole bill: close it when it is paid, merge two bills of one table,
// undo that merge, move it to another table. A waiter, a manager or a super admin of the bill's
// own restaurant; a kitchen tablet is refused (it cooks, it does not seat or bill anybody). The
// restaurant is always read from the row, and a bill of another restaurant reads as not found.
'use server'

import { requireOrderingStaff } from '@/lib/auth-guard'
import { billClose, billMerge, billMove, billUnmerge, type BillClose, type BillMerge, type BillMove, type BillUnmerge } from '@/lib/schemas/order-changes'
import { afterResponse } from '@/server/after-response'
import { pushChangeAnswers } from '@/server/change-push'
import { closeBill as close, moveBill as move, type CloseResult, type MoveResult } from '@/server/bill-changes'
import { mergeBills as merge, unmergeBill as unmerge, type MergeResult, type UnmergeResult } from '@/server/bill-merge'
import { orderRestaurant } from '@/server/order-owner'

/** The staff member acting on `billId`, guarded on the bill's own restaurant; a missing bill is refused like another tenant's. */
async function staffOnBill(billId: string) {
  return requireOrderingStaff(await orderRestaurant(billId))
}

/**
 * Parses `billClose` and closes the bill: stamps `closedAt` and who closed it on the order that
 * opened it, after which the table's next order opens a new bill. While dishes of it are still in
 * the kitchen or on the pass it answers `{ ok: false, refused: 'in_kitchen', dishes }` instead,
 * and `force` (the waiter's "close anyway") closes it regardless. Requests still open on its tickets
 * are refused, their waiters told. Answers `CloseResult`.
 */
export async function closeBill(raw: BillClose): Promise<CloseResult> {
  const { billId, force } = billClose.parse(raw)
  const result = await close(billId, force, await staffOnBill(billId))
  // A closed bill is final: the requests still open on it were refused, and their waiters are told.
  if (result.ok && result.answered.length > 0) afterResponse(() => pushChangeAnswers(result.answered))
  return result
}

/**
 * Parses `billMerge` and makes `billId` part of `intoId`: two open bills of the same table, this
 * service, neither closed nor cancelled. The tickets keep their numbers and their place in the
 * kitchen; only the bill they are paid on changes. Answers `MergeResult`.
 */
export async function mergeBills(raw: BillMerge): Promise<MergeResult> {
  const { billId, intoId } = billMerge.parse(raw)
  return merge(intoId, billId, await staffOnBill(intoId))
}

/**
 * Parses `billUnmerge` and undoes the merge that made `billId` part of another bill, as long as
 * neither has been closed since: it opens its own bill again with exactly the tickets it brought.
 * Answers `UnmergeResult`.
 */
export async function unmergeBill(raw: BillUnmerge): Promise<UnmergeResult> {
  const { billId } = billUnmerge.parse(raw)
  return unmerge(billId, await staffOnBill(billId))
}

/**
 * Parses `billMove` and moves the bill, every ticket of it, to `table`. A table with an open bill
 * of its own is refused with that bill named (`{ refused: 'occupied', openBill }`) unless
 * `mergeInto` names it, in which case the bill is moved and merged into it as one change.
 * Answers `MoveResult`.
 */
export async function moveBill(raw: BillMove): Promise<MoveResult> {
  const input = billMove.parse(raw)
  return move(input, await staffOnBill(input.billId))
}
