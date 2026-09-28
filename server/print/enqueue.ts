// server/print/enqueue.ts
// Writing what the kitchen's printers owe, in the same transaction as the event itself (the way
// server/pos/enqueue.ts writes the POS's): a ticket arriving or accepted, a ticket cancelled, a
// dish taken off. Either both are written or neither, so paper never comes out for a ticket that
// was rolled back. Nothing is sent from here: a printer asks for its jobs (app/api/print/epson).
// For a restaurant without a printer each of these is one indexed read and nothing more.
import type { Prisma, PrintTrigger } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'

/**
 * Queues the ticket `orderId` on every printer of `restaurantId` when the restaurant prints at
 * `moment` (on arrival, or on accept). Answers how many jobs it wrote.
 */
export async function enqueueTicketPrint(tx: Prisma.TransactionClient, restaurantId: string, orderId: string, moment: PrintTrigger): Promise<number> {
  const printers = await tx.printer.findMany({ where: { restaurantId, restaurant: { printTrigger: moment } }, select: { id: true } })
  if (printers.length === 0) return 0
  const { count } = await tx.printJob.createMany({ data: printers.map((printer) => ({ printerId: printer.id, orderId, kind: 'TICKET' as const })) })
  return count
}

/**
 * Queues a cancel slip for `orderId` (the whole ticket when `changeId` is null, else the removal
 * it names) on each printer that was given the ticket, and on no other: a ticket that never
 * printed (the restaurant prints on accept and it was never accepted, or it has no printer) gets
 * no slip, so the kitchen never reads a cancel for something it never saw. Answers how many jobs it wrote.
 */
export async function enqueueCancelPrint(tx: Prisma.TransactionClient, orderId: string, changeId: string | null): Promise<number> {
  const given = await tx.printJob.findMany({ where: { orderId, kind: 'TICKET' }, distinct: ['printerId'], select: { printerId: true } })
  if (given.length === 0) return 0
  const { count } = await tx.printJob.createMany({ data: given.map(({ printerId }) => ({ printerId, orderId, changeId, kind: 'CANCEL' as const })) })
  return count
}

/**
 * Prints the ticket `orderId` again, as it now stands, on every printer of `restaurantId`: the
 * pass lost the paper. Answers false when the ticket is not that restaurant's.
 */
export async function reprintTicket(restaurantId: string, orderId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { id: orderId, restaurantId }, select: { id: true } })
    if (!order) return false
    const printers = await tx.printer.findMany({ where: { restaurantId }, select: { id: true } })
    await tx.printJob.createMany({ data: printers.map((printer) => ({ printerId: printer.id, orderId, kind: 'TICKET' as const })) })
    return true
  })
}
