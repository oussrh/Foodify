// server/pos/payloads.ts
// What one outbox row says to the POS, read from the rows as they stand when it is sent: a ticket
// as it was ordered (its lines with the POS item each dish is matched to, or none), a change with
// the ticket's POS id, a close with what the bill came to. A ticket is sent as placed, not as it is
// now: a removal made since is its own row, sent after it, and sending both would take it off twice.
import type { PosOutboxKind } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { sumPrices } from '@/lib/money'
import type { PosAdapter, PosChange, PosResult } from '@/lib/pos/contract'
import { tabTotal } from '@/lib/table-tab'

/** The columns of an outbox row its payload is read from. */
export type PayloadRow = { id: string; kind: PosOutboxKind; orderId: string; changeId: string | null; connectionId: string }

/**
 * One send, ready to be made on an adapter, and the POS check a ticket goes on: its bill's POS id
 * for an addition, null for a bill's own first ticket (the check is then the id the POS gives it).
 */
export type PosCall = { send: (adapter: PosAdapter) => Promise<PosResult>; check: string | null }

/** Which POS item each of `dishIds` is matched to on `connectionId`. */
async function itemsOf(connectionId: string, dishIds: readonly (string | null)[]): Promise<Map<string, string>> {
  const ids = dishIds.filter((id): id is string => id !== null)
  if (ids.length === 0) return new Map()
  const rows = await prisma.posItemMap.findMany({ where: { connectionId, dishId: { in: ids } }, select: { dishId: true, externalItemId: true }, take: ids.length })
  return new Map(rows.map((row) => [row.dishId, row.externalItemId]))
}

const TICKET = {
  id: true,
  number: true,
  table: true,
  note: true,
  currency: true,
  createdAt: true,
  lines: { select: { id: true, dishId: true, nameEn: true, unitPrice: true, quantity: true, note: true } },
  parent: { select: { id: true, number: true, table: true, externalId: true } },
} as const

/** The ticket `row` reports, with the bill it belongs to. */
async function ticketCall(row: PayloadRow): Promise<PosCall> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: row.orderId }, select: TICKET })
  const items = await itemsOf(row.connectionId, order.lines.map((line) => line.dishId))
  const lines = order.lines.map((line) => ({
    lineId: line.id,
    name: line.nameEn,
    quantity: line.quantity,
    unitPrice: line.unitPrice.toFixed(2),
    note: line.note,
    externalItemId: line.dishId ? (items.get(line.dishId) ?? null) : null,
  }))
  const bill = order.parent ?? { id: order.id, number: order.number, table: order.table, externalId: null }
  const subtotal = sumPrices(lines.map((line) => ({ price: line.unitPrice, quantity: line.quantity })))
  const ticket = { idempotencyKey: row.id, id: order.id, number: order.number, table: order.table, note: order.note, currency: order.currency, subtotal, placedAt: order.createdAt.toISOString(), lines }
  return { send: (adapter) => adapter.sendTicket(bill, ticket), check: order.parent ? order.parent.externalId : null }
}

const CHANGE = { kind: true, lineId: true, quantity: true, reason: true, line: { select: { dishId: true } } } as const
type ChangeRow = { kind: string; lineId: string | null; quantity: number | null; reason: string | null; line: { dishId: string | null } | null }

/** A change as the contract names it: a removal or a void of `quantity` on one line; anything else, and no change at all (the board's cancel), cancels the ticket. */
function changeOf(change: ChangeRow | null): Pick<PosChange, 'kind' | 'lineId' | 'quantity' | 'reason'> {
  if (!change) return { kind: 'CANCEL', lineId: null, quantity: null, reason: null }
  const kind = change.kind === 'REMOVE' || change.kind === 'VOID' ? change.kind : 'CANCEL'
  return { kind, lineId: change.lineId, quantity: change.quantity, reason: change.reason }
}

/** The change `row` reports; a row with no change is the board cancelling the whole ticket. */
async function changeCall(row: PayloadRow): Promise<PosCall> {
  const ticket = await prisma.order.findUniqueOrThrow({ where: { id: row.orderId }, select: { id: true, externalId: true } })
  const change = row.changeId ? await prisma.orderChange.findUnique({ where: { id: row.changeId }, select: CHANGE }) : null
  const dishId = change?.line?.dishId ?? null
  const items = await itemsOf(row.connectionId, [dishId])
  const payload: PosChange = {
    idempotencyKey: row.id,
    ticketId: ticket.id,
    ticketExternalId: ticket.externalId,
    externalItemId: dishId ? (items.get(dishId) ?? null) : null,
    ...changeOf(change),
  }
  return { send: (adapter) => adapter.changeTicket(payload), check: null }
}

/** The close `row` reports: the bill, its POS id and what its tickets came to. */
async function closeCall(row: PayloadRow): Promise<PosCall> {
  const bill = await prisma.order.findUniqueOrThrow({
    where: { id: row.orderId },
    select: { id: true, externalId: true, closedAt: true, status: true, subtotal: true, additions: { select: { status: true, subtotal: true } } },
  })
  const total = tabTotal([bill, ...bill.additions].map((ticket) => ({ status: ticket.status, subtotal: ticket.subtotal.toFixed(2) })))
  const close = { idempotencyKey: row.id, billId: bill.id, externalId: bill.externalId, total, closedAt: (bill.closedAt ?? new Date()).toISOString() }
  return { send: async (adapter) => (adapter.closeBill ? adapter.closeBill(close) : { kind: 'ok', note: 'This POS does not close bills from outside: nothing to send' }), check: null }
}

/** The send `row` stands for, read now. */
export function callFor(row: PayloadRow): Promise<PosCall> {
  if (row.kind === 'TICKET') return ticketCall(row)
  if (row.kind === 'CHANGE') return changeCall(row)
  return closeCall(row)
}
