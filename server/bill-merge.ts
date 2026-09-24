// server/bill-merge.ts
// Two bills of one table made one, and the undo. A merge re-points the second bill and every
// addition it had at the first (a bill's tickets always point at the order that opened it,
// lib/table-tab.ts), and writes one OrderChange row per re-pointed ticket with one shared moment,
// which is what the undo reads to put exactly those tickets back. Nothing in the kitchen moves:
// each ticket keeps its number and its status. Both run with the two bills locked.
import type { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { serviceDayStart } from '@/lib/availability'
import { mergeRefusal, unmergeRefusal, type BillRefusal, type ServicePlace } from '@/lib/bill-structure'
import { billCancelled } from '@/lib/table-tab'
import { lockOrders, lockWithBill } from '@/server/order-lock'
import type { Actor } from '@/server/ticket-changes'

/** The columns a bill is checked by (lib/bill-structure.ts): its own, its number for the answer, and its additions' statuses. */
export const BILL_FACTS = {
  id: true,
  number: true,
  restaurantId: true,
  table: true,
  parentId: true,
  status: true,
  createdAt: true,
  closedAt: true,
  additions: { select: { status: true } },
} satisfies Prisma.OrderSelect

type BillRow = Prisma.OrderGetPayload<{ select: typeof BILL_FACTS }>

/** A bill row as the rules read it: cancelled only when every ticket of it is (lib/table-tab.ts `billCancelled`). */
export function billFacts<T extends BillRow | null>(row: T): T extends null ? null : BillRow & { cancelled: boolean }
export function billFacts(row: BillRow | null) {
  return row ? { ...row, cancelled: billCancelled([row, ...row.additions]) } : null
}

/** What a merge came to: the bill that now holds both; or why it could not be done. */
export type MergeResult = { ok: true; intoNumber: number } | { ok: false; refused: BillRefusal }

/** The restaurant's current service day, for the rules that are bounded by it. */
export async function servicePlace(tx: Prisma.TransactionClient, restaurantId: string, now: Date = new Date()): Promise<ServicePlace> {
  const restaurant = await tx.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, select: { timeZone: true } })
  return { restaurantId, serviceStart: serviceDayStart(now, restaurant.timeZone) }
}

/**
 * Merges `billId` into `intoId` inside `tx`, which has locked both. The rule decides on what is
 * read here; the caller has guarded `intoId`'s restaurant, and a bill of any other reads as not
 * found. Shared by the merge and by "move and merge".
 */
export async function mergeLocked(tx: Prisma.TransactionClient, intoId: string, billId: string, actor: Actor): Promise<MergeResult> {
  const into = billFacts(await tx.order.findUnique({ where: { id: intoId }, select: BILL_FACTS }))
  const merged = billFacts(await tx.order.findUnique({ where: { id: billId }, select: BILL_FACTS }))
  if (!into) return { ok: false, refused: 'not_found' }
  const refused = mergeRefusal(into, merged, await servicePlace(tx, into.restaurantId))
  if (refused || !merged) return { ok: false, refused: refused ?? 'not_found' }

  const additions = await tx.order.findMany({ where: { parentId: merged.id }, select: { id: true }, take: 500 })
  await tx.order.update({ where: { id: merged.id }, data: { parentId: into.id }, select: { id: true } })
  await tx.order.updateMany({ where: { parentId: merged.id }, data: { parentId: into.id } })
  // One moment for every row of this merge: the undo finds the re-pointed additions by it.
  const at = new Date()
  const row = { restaurantId: into.restaurantId, kind: 'MERGE' as const, status: 'APPLIED' as const, mergedOrderId: merged.id, requestedById: actor.id, createdAt: at }
  await tx.orderChange.createMany({ data: [{ ...row, orderId: into.id }, ...additions.map((addition) => ({ ...row, orderId: addition.id }))] })
  return { ok: true, intoNumber: into.number }
}

/** Merges `billId` into `intoId`: both locked, then `mergeLocked`. */
export async function mergeBills(intoId: string, billId: string, actor: Actor): Promise<MergeResult> {
  return prisma.$transaction(async (tx) => {
    await lockOrders(tx, [intoId, billId])
    return mergeLocked(tx, intoId, billId, actor)
  })
}

/** What an undo came to: the bill split off again and its number; or why it could not be. */
export type UnmergeResult = { ok: true; number: number } | { ok: false; refused: BillRefusal }

/**
 * Whether the surviving bill has been merged into another or moved since `at`: an undo puts
 * back the bills as they were, and after such a change there is no "as they were".
 */
async function changedSince(tx: Prisma.TransactionClient, intoId: string, at: Date): Promise<boolean> {
  const later = await tx.orderChange.count({
    where: { createdAt: { gt: at }, OR: [{ kind: 'MOVE', orderId: intoId }, { kind: 'MERGE', mergedOrderId: intoId }] },
  })
  return later > 0
}

/**
 * Undoes the merge that made `billId` part of another bill: the bill opens its own again and
 * takes back exactly the additions that merge re-pointed (an addition sent to the merged bill
 * since stays where it was sent). Refused when the merge is not on record, is no longer how the
 * bills stand, either bill has been closed since, or the surviving bill has been merged or moved
 * since. The bill and its parent are locked together, the parent read again under the lock.
 */
export async function unmergeBill(billId: string, actor: Actor): Promise<UnmergeResult> {
  return prisma.$transaction(async (tx) => {
    await lockWithBill(tx, billId)
    const merged = await tx.order.findUniqueOrThrow({ where: { id: billId }, select: { id: true, number: true, restaurantId: true, parentId: true, closedAt: true } })
    const into = merged.parentId ? await tx.order.findUnique({ where: { id: merged.parentId }, select: { id: true, parentId: true, closedAt: true } }) : null
    const record = into
      ? await tx.orderChange.findFirst({ where: { kind: 'MERGE', orderId: into.id, mergedOrderId: merged.id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
      : null
    const since = into && record ? { changedSince: await changedSince(tx, into.id, record.createdAt) } : null
    const refused = unmergeRefusal(merged, into, since)
    if (refused || !into || !record) return { ok: false, refused: refused ?? 'not_merged' }

    const moved = await tx.orderChange.findMany({
      where: { kind: 'MERGE', mergedOrderId: merged.id, createdAt: record.createdAt, orderId: { not: into.id } },
      select: { orderId: true },
      take: 500,
    })
    await tx.order.update({ where: { id: merged.id }, data: { parentId: null }, select: { id: true } })
    await tx.order.updateMany({ where: { id: { in: moved.map((row) => row.orderId) }, parentId: into.id }, data: { parentId: merged.id } })
    await tx.orderChange.create({
      data: { restaurantId: merged.restaurantId, orderId: into.id, kind: 'UNMERGE', status: 'APPLIED', mergedOrderId: merged.id, requestedById: actor.id },
      select: { id: true },
    })
    return { ok: true, number: merged.number }
  })
}
