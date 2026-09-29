// server/print/view.ts
// The Printers section's reading of one restaurant (lib/print/view.ts): when tickets print, and
// each printer with its last poll, its last error and what it still owes. The database only; no
// secret. The caller has guarded the restaurant.
import prisma from '@/lib/prisma'
import type { PrintView } from '@/lib/print/view'

type Count = { printerId: string; status: string; _count: { _all: number } }

/** How many of `printerId`'s jobs are in one of `statuses`. */
function countOf(counts: Count[], printerId: string, statuses: string[]): number {
  return counts.filter((row) => row.printerId === printerId && statuses.includes(row.status)).reduce((sum, row) => sum + row._count._all, 0)
}

/** Everything the Printers section shows for `restaurantId`. */
export async function loadPrintView(restaurantId: string): Promise<PrintView> {
  const [restaurant, printers, counts] = await Promise.all([
    prisma.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, select: { printTrigger: true } }),
    prisma.printer.findMany({ where: { restaurantId }, orderBy: { createdAt: 'asc' }, select: { id: true, name: true, lastSeenAt: true, lastError: true } }),
    prisma.printJob.groupBy({ by: ['printerId', 'status'], where: { printer: { restaurantId }, status: { in: ['PENDING', 'SENT', 'FAILED'] } }, _count: { _all: true } }),
  ])
  return {
    restaurantId,
    trigger: restaurant.printTrigger,
    printers: printers.map((printer) => ({
      id: printer.id,
      name: printer.name,
      lastSeenAt: printer.lastSeenAt?.toISOString() ?? null,
      lastError: printer.lastError,
      waiting: countOf(counts, printer.id, ['PENDING', 'SENT']),
      failed: countOf(counts, printer.id, ['FAILED']),
    })),
  }
}
