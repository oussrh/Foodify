// app/api/orders/track/[token]/route.ts
// Where a guest's phone asks how their order is doing. The path's secret names the order: it was
// handed back once when the guest placed it (POST /api/orders) and only its SHA-256 is stored
// (server/secret.ts), so there is no session, and the order's id, which is logged by design,
// opens nothing. The answer is the guest's reading of the order (lib/order-tracking.ts) and
// nothing the kitchen or the floor keeps to themselves.
import { fail, ok } from '@/lib/api'
import prisma from '@/lib/prisma'
import { serializeTrackedOrder, trackedOrderSelect } from '@/lib/order-tracking'
import { trackSegment } from '@/lib/schemas/order-tracking'
import { log } from '@/server/log'
import { hashSecret } from '@/server/secret'

/**
 * GET, public (the secret is the capability). Answers 200 `{ data: TrackedOrder }`: number, table,
 * status, the lines still coming (English and French names, quantity), subtotal, currency, the
 * moments it was placed, accepted, called up and served, and the restaurant's slug and name,
 * never stored by a cache (`no-store`). A malformed secret and an unknown one are the same 404
 * not_found, so the answer says nothing about which secrets exist; 500 internal.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const segment = trackSegment.safeParse(await params)
  if (!segment.success) return fail('not_found', 'Unknown order', 404)
  try {
    const row = await prisma.order.findUnique({ where: { guestTokenHash: hashSecret(segment.data.token) }, select: trackedOrderSelect })
    if (!row) return fail('not_found', 'Unknown order', 404)
    return ok(serializeTrackedOrder(row), { noStore: true })
  } catch (error) {
    log.error({ err: error }, 'order: tracking read failed')
    return fail('internal', 'Internal error', 500)
  }
}
