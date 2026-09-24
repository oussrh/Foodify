// tests/integration/insights-orders.ts
// An order as the insights suites need one: placed at a given moment, by a guest or a waiter,
// with any of the kitchen's stamps, a status and a subtotal, and optionally its lines.
import type { Tx } from './db'

export const at = (iso: string) => new Date(iso)

export interface OrderSpec {
  number: number
  created: string
  accepted?: string
  ready?: string
  served?: string
  /** A waiter's id: the order was taken at the table, so there is no phone to text. */
  placedById?: string
  status?: 'NEW' | 'ACCEPTED' | 'READY' | 'DONE' | 'CANCELLED'
  subtotal?: string
  lines?: { dishId: string; quantity: number; unitPrice: string }[]
  /** The bill this order adds to: an addition, not an order of its own. */
  parentId?: string
}

export async function order(tx: Tx, restaurantId: string, spec: OrderSpec) {
  return tx.order.create({
    data: {
      restaurantId,
      number: spec.number,
      table: String(spec.number),
      phone: spec.placedById ? '' : '+212600112233',
      subtotal: spec.subtotal ?? '9.50',
      status: spec.status ?? 'NEW',
      placedById: spec.placedById ?? null,
      parentId: spec.parentId ?? null,
      createdAt: at(spec.created),
      acceptedAt: spec.accepted ? at(spec.accepted) : null,
      readyAt: spec.ready ? at(spec.ready) : null,
      servedAt: spec.served ? at(spec.served) : null,
      lines: {
        create: (spec.lines ?? []).map((line) => ({ ...line, nameEn: 'Line', nameFr: 'Ligne' })),
      },
    },
    select: { id: true },
  })
}
