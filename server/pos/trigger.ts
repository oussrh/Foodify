// server/pos/trigger.ts
// When the outbox is swept. Right after a response that queued something (`kickDelivery`, the way
// a push is sent); opportunistically when a board or a waiter polls (`sweepSoon`, at most once per
// thirty seconds per restaurant on this instance, never delaying the poll, and only for a
// restaurant with an active connection: one indexed read per window, after the response); and
// daily by Vercel's cron (app/api/pos/outbox/route.ts), which picks up whatever the other two
// missed. Every sweep runs after the response (server/after-response.ts) and reports rather than throws.
import prisma from '@/lib/prisma'
import { afterResponse } from '@/server/after-response'
import { deliverDue } from '@/server/pos/deliver'

/** The least time between two poll-driven sweeps of one restaurant on one instance. */
export const SWEEP_EVERY_MS = 30_000
/** How many restaurants the throttle remembers before it starts over: an instance serves few, and a reset only allows one early sweep each. */
const REMEMBERED = 1000

const lastSweep = new Map<string, number>()

/** Sweeps `restaurantId`'s outbox once the response has gone: something was just queued. */
export function kickDelivery(restaurantId: string): void {
  afterResponse(() => deliverDue({ restaurantId }))
}

/** Whether `restaurantId` has a connection that sends: the one read a poll costs a restaurant without a POS. */
async function sends(restaurantId: string): Promise<boolean> {
  const active = await prisma.posConnection.findFirst({ where: { restaurantId, status: 'ACTIVE', restaurant: { posEnabled: true } }, select: { id: true } })
  return active !== null
}

/**
 * After the response, sweeps `restaurantId`'s outbox if it has an active connection, unless this
 * restaurant was looked at in the last SWEEP_EVERY_MS on this instance. Answers whether it looked.
 */
export function sweepSoon(restaurantId: string, now: number = Date.now()): boolean {
  const last = lastSweep.get(restaurantId)
  if (last !== undefined && now - last < SWEEP_EVERY_MS) return false
  if (lastSweep.size >= REMEMBERED) lastSweep.clear()
  lastSweep.set(restaurantId, now)
  afterResponse(async () => {
    if (await sends(restaurantId)) await deliverDue({ restaurantId })
  })
  return true
}
