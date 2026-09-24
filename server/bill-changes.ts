// server/bill-changes.ts
// Closing a bill once it is paid, and moving one to another table. Both lock the bill before they
// read what they decide on, the way an addition to it does (server/order-store.ts), so a bill
// closed on one phone while another sends an addition to it ends one way or the other, never
// both. A move onto a table that already has an open bill is refused with that bill named, so the
// waiter can choose "move and merge", which is the move and the merge in one transaction.
import type { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { dishesInKitchen } from '@/lib/bill-lines'
import { closeRefusal, landingBill, mergeRefusal, moveRefusal, type BillRefusal } from '@/lib/bill-structure'
import { billCancelled } from '@/lib/table-tab'
import { BILL_FACTS, billFacts, mergeLocked, servicePlace } from '@/server/bill-merge'
import { lockOrders } from '@/server/order-lock'
import { refusePending } from '@/server/ticket-apply'
import type { Actor } from '@/server/ticket-changes'

const QUANTITIES = { select: { quantity: true, removedQuantity: true } } as const

/**
 * What a close came to: closed, with the requests it answered (refused: a closed bill is final);
 * or refused, with how many dishes are still in the kitchen when that is why.
 */
export type CloseResult =
  | { ok: true; closedAt: string; answered: string[] }
  | { ok: false; refused: 'in_kitchen'; dishes: number }
  | { ok: false; refused: BillRefusal }

/**
 * Closes `billId`: stamps who and when on the order that opened it, and answers every request
 * still open on its tickets (refused: after a close only a manager's void changes it). With
 * dishes of the bill still in the kitchen or on the pass it answers how many instead, unless
 * `force` (the waiter's "close anyway"); the forced close records that count. The caller has
 * guarded the bill's restaurant.
 */
export async function closeBill(billId: string, force: boolean, actor: Actor): Promise<CloseResult> {
  return prisma.$transaction(async (tx) => {
    await lockOrders(tx, [billId])
    const bill = await tx.order.findUniqueOrThrow({
      where: { id: billId },
      select: { restaurantId: true, parentId: true, status: true, closedAt: true, lines: QUANTITIES, additions: { select: { id: true, status: true, lines: QUANTITIES } } },
    })
    const tickets = [bill, ...bill.additions]
    const refused = closeRefusal({ ...bill, cancelled: billCancelled(tickets) })
    if (refused) return { ok: false, refused }
    const dishes = dishesInKitchen(tickets)
    if (dishes > 0 && !force) return { ok: false, refused: 'in_kitchen', dishes }

    const closedAt = new Date()
    await tx.order.update({ where: { id: billId }, data: { closedAt, closedById: actor.id }, select: { id: true } })
    await tx.orderChange.create({
      data: { restaurantId: bill.restaurantId, orderId: billId, kind: 'CLOSE', status: 'APPLIED', quantity: dishes > 0 ? dishes : null, requestedById: actor.id },
      select: { id: true },
    })
    const answered = await refusePending(tx, [billId, ...bill.additions.map((addition) => addition.id)], actor.id)
    return { ok: true, closedAt: closedAt.toISOString(), answered }
  })
}

/** What a move came to: the table it is at now, and the bill it joined when it was also merged; or why not. */
export type MoveResult =
  | { ok: true; table: string; mergedInto: number | null }
  | { ok: false; refused: 'occupied'; openBill: { id: string; number: number } }
  | { ok: false; refused: BillRefusal }

/** How many of a table's bills of the day a move looks at to find the one it would land on. */
const RECENT_BILLS = 10
/** How many times a move re-reads a landing bill that changed between the read and the lock. */
const LOCK_ATTEMPTS = 3

type MoveInput = { billId: string; table: string; mergeInto?: string | undefined }

/** The bill, its service day and the open bill at the target table, as they stand now. */
async function readMove(tx: Prisma.TransactionClient, input: MoveInput) {
  const bill = billFacts(await tx.order.findUniqueOrThrow({ where: { id: input.billId }, select: BILL_FACTS }))
  const place = await servicePlace(tx, bill.restaurantId)
  const there = await tx.order.findMany({
    where: { restaurantId: bill.restaurantId, table: input.table, parentId: null, createdAt: { gte: place.serviceStart } },
    orderBy: { createdAt: 'desc' },
    take: RECENT_BILLS,
    select: BILL_FACTS,
  })
  return { bill, place, landing: landingBill(there.map(billFacts), place, input.table) }
}

/**
 * The move's rows, locked: the bill and the bill it would land on, in one sorted call, then read
 * again under the lock. A landing bill that changed in between (opened, closed) is locked on the
 * next pass, so the move is always decided on locked rows.
 */
async function lockMove(tx: Prisma.TransactionClient, input: MoveInput) {
  for (let attempt = 0; attempt < LOCK_ATTEMPTS; attempt++) {
    const seen = await readMove(tx, input)
    await lockOrders(tx, seen.landing ? [input.billId, seen.landing.id] : [input.billId])
    const locked = await readMove(tx, input)
    if (locked.landing?.id === seen.landing?.id) return locked
  }
  throw new Error('move: the target table kept changing under the lock')
}

/**
 * Moves `billId`, with every addition, to `table`. When that table has an open bill the move is
 * refused and names it, unless `mergeInto` is that bill: then the moved bill is merged into it in
 * the same transaction. When the bill named by `mergeInto` is no longer open there, the move goes
 * ahead on its own, since the table it was going to share is free.
 */
export async function moveBill(input: MoveInput, actor: Actor): Promise<MoveResult> {
  return prisma.$transaction(async (tx) => {
    const { bill, place, landing } = await lockMove(tx, input)
    const refused = moveRefusal(bill, place, input.table)
    if (refused) return { ok: false, refused }
    if (landing && landing.id !== input.mergeInto) return { ok: false, refused: 'occupied', openBill: { id: landing.id, number: landing.number } }
    // Asked before anything is written, as it will stand once the bill is at the new table.
    const unmergeable = landing ? mergeRefusal(landing, { ...bill, table: input.table }, place) : null
    if (unmergeable) return { ok: false, refused: unmergeable }

    await tx.order.updateMany({ where: { OR: [{ id: bill.id }, { parentId: bill.id }] }, data: { table: input.table } })
    await tx.orderChange.create({
      data: { restaurantId: bill.restaurantId, orderId: bill.id, kind: 'MOVE', status: 'APPLIED', fromTable: bill.table, toTable: input.table, requestedById: actor.id },
      select: { id: true },
    })
    if (!landing) return { ok: true, table: input.table, mergedInto: null }
    const merged = await mergeLocked(tx, landing.id, bill.id, actor)
    // Checked above on the same locked rows, so this cannot refuse; if it ever did, the throw rolls
    // the move back with it rather than leave a bill moved and not merged.
    if (!merged.ok) throw new Error(`move and merge: merge refused (${merged.refused})`)
    return { ok: true, table: input.table, mergedInto: merged.intoNumber }
  })
}
