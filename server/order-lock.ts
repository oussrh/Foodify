// server/order-lock.ts
// The row lock every change to a sent order takes before it reads what it is about to decide on,
// the way server/order-store.ts locks a bill before adding to it: a change checked on one read
// and written on another is a race between two phones, or a phone and the pass. Several rows are
// locked in one statement, in id order, so two changes naming the same pair never wait on each
// other in opposite orders.
import { Prisma } from '@/generated/prisma/client'

/**
 * Locks the orders named by `ids` until the transaction ends (`SELECT … FOR UPDATE`, in id order)
 * and answers the ids that exist. A missing id is simply not locked: the caller's read says so.
 */
export async function lockOrders(tx: Prisma.TransactionClient, ids: readonly string[]): Promise<string[]> {
  const unique = [...new Set(ids)].sort()
  if (unique.length === 0) return []
  const rows = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Order" WHERE "id" IN (${Prisma.join(unique)}) ORDER BY "id" FOR UPDATE`
  return rows.map((row) => row.id)
}

/** How many times `lockWithBill` re-reads a parent that changed under it before giving up: a merge is rare, two in a row rarer. */
const LOCK_ATTEMPTS = 3

/**
 * Locks order `id` and the bill it belongs to (its parent, when it is an addition) in one sorted
 * call, then re-reads the parent under the lock: a merge between the read and the lock moves it,
 * and the new parent is locked on the next pass. Answers the parent id (null for a bill, or for
 * an id that does not exist). Every change that decides on a bill's state takes both rows.
 */
export async function lockWithBill(tx: Prisma.TransactionClient, id: string): Promise<string | null> {
  for (let attempt = 0; attempt < LOCK_ATTEMPTS; attempt++) {
    const before = await tx.order.findUnique({ where: { id }, select: { parentId: true } })
    if (!before) return null
    await lockOrders(tx, before.parentId ? [id, before.parentId] : [id])
    const after = await tx.order.findUniqueOrThrow({ where: { id }, select: { parentId: true } })
    if (after.parentId === before.parentId) return after.parentId
  }
  throw new Error('order-lock: the bill kept changing under the lock')
}
