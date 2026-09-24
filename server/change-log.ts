// server/change-log.ts
// Reads one ticket's or one bill's change log (lib/change-log.ts) for the manager's order details:
// the rows on that order, newest first, the dish each one named and the people by the name they
// sign in with. The caller guards; this reads what it is asked.
import prisma from '@/lib/prisma'
import type { ChangeLogEntry } from '@/lib/change-log'

/** A log is a bill's afternoon, not its history: bounded well above anything a table does. */
const MAX_ENTRIES = 100

const PERSON = { select: { username: true, email: true } } as const

/** The name a person is shown by in the log: a device's username, a person's address. */
const nameOf = (user: { username: string | null; email: string } | null) => (user ? (user.username ?? user.email) : null)

/** The change log of `orderId`, newest first. */
export async function loadChangeLog(orderId: string): Promise<ChangeLogEntry[]> {
  const rows = await prisma.orderChange.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
    take: MAX_ENTRIES,
    select: {
      id: true,
      kind: true,
      status: true,
      quantity: true,
      reason: true,
      note: true,
      fromTable: true,
      toTable: true,
      mergedOrderId: true,
      createdAt: true,
      decidedAt: true,
      line: { select: { nameEn: true } },
      requestedBy: PERSON,
      decidedBy: PERSON,
    },
  })
  const mergedIds = rows.flatMap((row) => (row.mergedOrderId ? [row.mergedOrderId] : []))
  const merged = mergedIds.length ? await prisma.order.findMany({ where: { id: { in: mergedIds } }, select: { id: true, number: true }, take: MAX_ENTRIES }) : []
  const numberOf = new Map(merged.map((order) => [order.id, order.number]))
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    status: row.status,
    dish: row.line?.nameEn ?? null,
    quantity: row.quantity,
    reason: row.reason,
    note: row.note,
    fromTable: row.fromTable,
    toTable: row.toTable,
    mergedNumber: row.mergedOrderId ? (numberOf.get(row.mergedOrderId) ?? null) : null,
    by: nameOf(row.requestedBy),
    decidedBy: nameOf(row.decidedBy),
    createdAt: row.createdAt.toISOString(),
    decidedAt: row.decidedAt?.toISOString() ?? null,
  }))
}
