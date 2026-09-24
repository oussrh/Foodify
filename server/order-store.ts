// server/order-store.ts
// Writing an order: the number taken from the restaurant's counter, then the row with its
// re-priced lines. An addition to a table's bill is written in one transaction that first locks
// the bill's row and checks it again (lib/table-tab.ts), so a bill cancelled on the pass, or
// closed on another phone (server/bill-changes.ts), while a waiter was sending cannot gain an
// addition: the cancel or the close waits for the lock, or the send reads it and is refused. Nothing is numbered for a refused addition, so it leaves no gap.
import type { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { sumPrices } from '@/lib/money'
import type { OrderInput } from '@/lib/schemas/order'
import { addToRefusal, billCancelled, type AddToRefusal, type TabPlace } from '@/lib/table-tab'

/** One line as the row stores it: the dish's name and unit price copied at the time, the guest's note. */
export type PricedLine = { dishId: string; nameEn: string; nameFr: string; unitPrice: string; quantity: number; note: string | null }

/** What the route needs to write an order besides the parsed body. */
export interface StoreContext {
  staffId: string | null
  currency: string | null
  lines: PricedLine[]
  /** Where the order goes; an addition is checked against it under the lock. */
  place: TabPlace
}

const PLACED = { id: true, number: true, table: true, subtotal: true, parent: { select: { number: true } } } satisfies Prisma.OrderSelect

/** The bill named by `addTo`, locked until the transaction ends, or null when there is none. */
async function lockBill(tx: Prisma.TransactionClient, id: string) {
  const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Order" WHERE "id" = ${id} FOR UPDATE`
  if (locked.length === 0) return null
  const bill = await tx.order.findUnique({
    where: { id },
    select: { restaurantId: true, table: true, parentId: true, status: true, createdAt: true, closedAt: true, additions: { select: { status: true } } },
  })
  // Cancelled is the bill's state, not the opening ticket's (lib/table-tab.ts `billCancelled`).
  return bill ? { ...bill, cancelled: billCancelled([bill, ...bill.additions]) } : null
}

/**
 * Writes the order, or refuses an addition whose bill is not this table's open one at the moment
 * of writing. The number is taken after the check, so a refusal takes none; an order that fails
 * after the increment rolls it back with the rest.
 */
export async function storeOrder(input: OrderInput, context: StoreContext): Promise<{ refused: AddToRefusal } | { order: Prisma.OrderGetPayload<{ select: typeof PLACED }> }> {
  return prisma.$transaction(async (tx) => {
    if (input.addTo) {
      const refused = addToRefusal(await lockBill(tx, input.addTo), context.place)
      if (refused) return { refused }
    }
    const { nextOrderNumber } = await tx.restaurant.update({
      where: { id: input.restaurantId },
      data: { nextOrderNumber: { increment: 1 } },
      select: { nextOrderNumber: true },
    })
    const order = await tx.order.create({
      data: {
        restaurantId: input.restaurantId,
        number: nextOrderNumber - 1,
        table: input.table,
        phone: input.phone ?? '',
        placedById: context.staffId,
        parentId: input.addTo ?? null,
        note: input.note || null,
        subtotal: sumPrices(context.lines.map((line) => ({ price: line.unitPrice, quantity: line.quantity }))),
        currency: context.currency,
        lines: { create: context.lines },
      },
      select: PLACED,
    })
    return { order }
  })
}
