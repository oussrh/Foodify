import { describe, expect, it, vi } from 'vitest'
import type { PosCall, PayloadRow } from '@/server/pos/payloads'
import { LOCATION, connection, outbox, place, posFloor } from './pos-fixtures'
import { mergeBills } from '@/app/actions/bill-actions'
import { resumePos, retryPosNow } from '@/app/actions/pos-control-actions'
import { removeLine } from '@/app/actions/ticket-actions'
import { claimDue } from '@/server/pos/claim'
import { deliverClaimed, deliverDue } from '@/server/pos/deliver'
import { newRestaurantCode } from '@/lib/restaurant-code'
import { sealCredentials } from '@/server/pos-crypto'
import { db, withRollback, type Tx } from './db'
import { first, ticket } from './bill-fixtures'
import { signInAs } from './session'

// Sending the outbox to the Test POS, on the real database: what it takes is SENT with its id
// (stamped on the order too, with the check it went on), a retry backs off 1, 5, 15, 60 minutes and
// then fails, a refusal is final, a paused connection sends nothing and asks on Resume, a bill's
// and a ticket's rows go in order (after a merge too), two workers never claim one row at once, and
// a worker whose lease ran out records nothing. The Test POS's behaviour is set by its key (lib/pos/test-adapter.ts).

const MINUTE = 60_000

// A hook run while a send is on its way to the POS, so a test can make a lease run out mid-send.
const midSend = vi.hoisted(() => ({ run: null as null | (() => Promise<unknown>) }))
vi.mock('@/server/pos/payloads', async (original) => {
  const actual = await original<typeof import('@/server/pos/payloads')>()
  return {
    callFor: async (row: PayloadRow): Promise<PosCall> => {
      const call = await actual.callFor(row)
      return { ...call, send: async (adapter) => (await midSend.run?.(), call.send(adapter)) }
    },
  }
})
const guestOrder = (restaurantId: string, dishId: string) => ({ restaurantId, table: '4', phone: '+212600112233', lines: [{ dishId, quantity: 2 }] })

/** A restaurant whose Test POS runs under `apiKey`, with one guest order queued. */
async function queued(tx: Tx, apiKey = 'test_demo_key') {
  const floor = await posFloor(tx)
  await connection(tx, floor.place.id, { apiKey })
  const orderId = await place(guestOrder(floor.place.id, floor.harira.id))
  return { ...floor, orderId }
}

describe('delivering the outbox', () => {
  it('marks a ticket the POS took SENT, with its id on the row, the order and the connection’s last sync', () =>
    withRollback(async (tx) => {
      const { place: restaurant, orderId } = await queued(tx)
      expect(await deliverDue({ restaurantId: restaurant.id })).toEqual({ sent: 1, retried: 0, failed: 0, refused: 0, errors: 0 })
      expect(await outbox(tx, restaurant.id)).toMatchObject([{ status: 'SENT', attempts: 1, externalId: `tpos-ticket-${orderId}`, lastAnswer: expect.stringMatching(/^Received ticket #\d+ for table 4 \(opening its bill\): 1 lines, 1 unmatched kept as open items$/) }])
      expect(await tx.order.findUniqueOrThrow({ where: { id: orderId }, select: { externalId: true, posCheckId: true } })).toEqual({ externalId: `tpos-ticket-${orderId}`, posCheckId: `tpos-ticket-${orderId}` })
      expect((await tx.posConnection.findUniqueOrThrow({ where: { restaurantId: restaurant.id } })).lastSyncAt).toBeInstanceOf(Date)
    }))

  it('backs a retry off 1, 5, 15 and 60 minutes, then marks it FAILED', () =>
    withRollback(async (tx) => {
      const { place: restaurant } = await queued(tx, 'test_retry_always')
      const t0 = new Date()
      const waits = [1, 5, 15, 60]
      let now = t0
      for (const [index, wait] of waits.entries()) {
        expect(await deliverDue({ restaurantId: restaurant.id, now })).toMatchObject({ retried: 1 })
        const [row] = await outbox(tx, restaurant.id)
        expect(row).toMatchObject({ status: 'PENDING', attempts: index + 1, lastAnswer: 'The Test POS asked to try again later' })
        expect(row?.nextAttemptAt).toEqual(new Date(now.getTime() + wait * MINUTE))
        // Not due a moment before the wait is over.
        expect(await deliverDue({ restaurantId: restaurant.id, now: new Date(now.getTime() + wait * MINUTE - 1000) })).toMatchObject({ retried: 0 })
        now = new Date(now.getTime() + wait * MINUTE)
      }
      expect(await deliverDue({ restaurantId: restaurant.id, now })).toMatchObject({ failed: 1 })
      expect(await outbox(tx, restaurant.id)).toMatchObject([{ status: 'FAILED', attempts: 5 }])
      expect((await tx.posConnection.findUniqueOrThrow({ where: { restaurantId: restaurant.id } })).lastError).toBe('The Test POS asked to try again later')
    }))

  it('sends on the retry that the POS takes', () =>
    withRollback(async (tx) => {
      const { place: restaurant } = await queued(tx, 'test_retry1_key')
      const t0 = new Date()
      expect(await deliverDue({ restaurantId: restaurant.id, now: t0 })).toMatchObject({ retried: 1 })
      expect(await deliverDue({ restaurantId: restaurant.id, now: new Date(t0.getTime() + MINUTE) })).toMatchObject({ sent: 1 })
    }))

  it('marks a refusal REFUSED and never sends it again', () =>
    withRollback(async (tx) => {
      const { place: restaurant } = await queued(tx, 'test_refuse_key')
      expect(await deliverDue({ restaurantId: restaurant.id })).toMatchObject({ refused: 1 })
      expect(await deliverDue({ restaurantId: restaurant.id, now: new Date(Date.now() + 120 * MINUTE) })).toEqual({ sent: 0, retried: 0, failed: 0, refused: 0, errors: 0 })
      expect(await outbox(tx, restaurant.id)).toMatchObject([{ status: 'REFUSED', attempts: 1, lastAnswer: 'The Test POS refused it (the key asks for refusals)' }])
    }))

  it('sends nothing while the connection is paused, and keeps the row', () =>
    withRollback(async (tx) => {
      const { place: restaurant } = await queued(tx)
      await tx.posConnection.update({ where: { restaurantId: restaurant.id }, data: { status: 'PAUSED' } })
      expect(await deliverDue({ restaurantId: restaurant.id })).toEqual({ sent: 0, retried: 0, failed: 0, refused: 0, errors: 0 })
      expect(await outbox(tx, restaurant.id)).toMatchObject([{ status: 'PENDING', attempts: 0 }])
    }))

  it('asks on Resume: sends what waited during the pause, or discards it for the record', () =>
    withRollback(async (tx) => {
      const sending = await queued(tx)
      await tx.posConnection.update({ where: { restaurantId: sending.place.id }, data: { status: 'PAUSED' } })
      await place(guestOrder(sending.place.id, sending.harira.id))
      expect((await outbox(tx, sending.place.id)).map((row) => row.status)).toEqual(['PENDING', 'PENDING'])
      signInAs(sending.manager)
      expect(await resumePos(sending.place.id, { waiting: 'send' })).toEqual({ ok: true, status: 'ACTIVE', discarded: 0 })
      expect(await deliverDue({ restaurantId: sending.place.id })).toMatchObject({ sent: 2 })

      const dropping = await queued(tx)
      await tx.posConnection.update({ where: { restaurantId: dropping.place.id }, data: { status: 'PAUSED' } })
      signInAs(dropping.manager)
      expect(await resumePos(dropping.place.id, { waiting: 'discard' })).toEqual({ ok: true, status: 'ACTIVE', discarded: 1 })
      expect(await deliverDue({ restaurantId: dropping.place.id })).toMatchObject({ sent: 0 })
      expect(await outbox(tx, dropping.place.id)).toMatchObject([{ status: 'DISCARDED', attempts: 0 }])
    }))

  it('keeps a change behind its ticket after a merge moves the ticket to another bill', () =>
    withRollback(async (tx) => {
      const { place: restaurant, waiter } = await posFloor(tx)
      const made = await connection(tx, restaurant.id)
      const into = await ticket(tx, restaurant.id, { status: 'ACCEPTED', minutesAgo: 30 })
      const moved = await ticket(tx, restaurant.id, { status: 'NEW', minutesAgo: 20 })
      // Both tickets were queued as their own bills; the one about to be merged is waiting out a retry.
      for (const bill of [into, moved]) await tx.posOutbox.create({ data: { connectionId: made.id, restaurantId: restaurant.id, orderId: bill.id, billId: bill.id, kind: 'TICKET' } })
      const later = new Date(Date.now() + 5 * MINUTE)
      await tx.posOutbox.updateMany({ where: { orderId: moved.id }, data: { nextAttemptAt: later, attempts: 1 } })
      signInAs(waiter)
      expect(await mergeBills({ billId: moved.id, intoId: into.id })).toMatchObject({ ok: true })
      await removeLine({ lineId: first(moved.lines).id, quantity: 1, reason: 'mistake' })
      const change = first((await outbox(tx, restaurant.id)).filter((row) => row.kind === 'CHANGE'))
      // Queued on the bill it now belongs to, but still about the waiting ticket.
      expect(change).toMatchObject({ orderId: moved.id, billId: into.id })

      expect(await deliverDue({ restaurantId: restaurant.id })).toMatchObject({ sent: 1 })
      expect((await outbox(tx, restaurant.id)).find((row) => row.id === change.id)).toMatchObject({ status: 'PENDING', attempts: 0 })
      expect(await deliverDue({ restaurantId: restaurant.id, now: later })).toMatchObject({ sent: 2 })
    }))

  it('records nothing for a worker whose lease ran out and whose row another claim now holds', () =>
    withRollback(async (tx) => {
      const { place: restaurant } = await queued(tx)
      const t0 = new Date()
      const stale = await claimDue(tx, { restaurantId: restaurant.id, now: t0, limit: 10 })
      // The lease runs out; another worker claims the row and holds it.
      const fresh = await claimDue(tx, { restaurantId: restaurant.id, now: new Date(t0.getTime() + 3 * MINUTE), limit: 10 })
      expect(fresh.ids).toEqual(stale.ids)
      expect(await deliverClaimed(first(stale.ids), stale.token, t0)).toBeNull()
      expect(await outbox(tx, restaurant.id)).toMatchObject([{ status: 'PENDING', attempts: 2, externalId: null }])
      expect(await deliverClaimed(first(fresh.ids), fresh.token, t0)).toBe('SENT')
    }))

  it('records nothing when the lease runs out while the send is on its way, and another claim takes the row', () =>
    withRollback(async (tx) => {
      const { place: restaurant } = await queued(tx)
      const t0 = new Date()
      const slow = await claimDue(tx, { restaurantId: restaurant.id, now: t0, limit: 10 })
      let taken: string[] = []
      midSend.run = async () => {
        taken = (await claimDue(tx, { restaurantId: restaurant.id, now: new Date(t0.getTime() + 3 * MINUTE), limit: 10 })).ids
      }
      try {
        expect(await deliverClaimed(first(slow.ids), slow.token, t0)).toBeNull()
      } finally {
        midSend.run = null
      }
      expect(taken).toEqual(slow.ids)
      expect(await outbox(tx, restaurant.id)).toMatchObject([{ status: 'PENDING', attempts: 2, externalId: null, lastAnswer: null }])
    }))

  it('counts a row that breaks and goes on with the next', () =>
    withRollback(async (tx) => {
      const { place: restaurant, harira } = await queued(tx)
      await place(guestOrder(restaurant.id, harira.id))
      const broken = first(await outbox(tx, restaurant.id))
      // A row naming a ticket that is not there (the constraint lifted inside this rolled-back transaction): its payload cannot be read.
      await tx.$executeRaw`ALTER TABLE "PosOutbox" DROP CONSTRAINT "PosOutbox_orderId_fkey"`
      await tx.posOutbox.update({ where: { id: broken.id }, data: { orderId: '00000000-0000-4000-8000-000000000000', billId: 'elsewhere' } })
      expect(await deliverDue({ restaurantId: restaurant.id })).toMatchObject({ sent: 1, errors: 1 })
    }))

  it('holds an addition until its bill’s ticket is sent', () =>
    withRollback(async (tx) => {
      const { place: restaurant, harira, waiter, orderId: bill } = await queued(tx)
      signInAs(waiter)
      const addition = await place({ restaurantId: restaurant.id, table: '4', addTo: bill, lines: [{ dishId: harira.id, quantity: 1 }] })
      // The bill's ticket is waiting out a retry: the addition, due, must not overtake it.
      const later = new Date(Date.now() + 5 * MINUTE)
      await tx.posOutbox.updateMany({ where: { orderId: bill }, data: { nextAttemptAt: later, attempts: 1 } })
      expect(await deliverDue({ restaurantId: restaurant.id })).toEqual({ sent: 0, retried: 0, failed: 0, refused: 0, errors: 0 })
      expect((await outbox(tx, restaurant.id)).find((row) => row.orderId === addition)).toMatchObject({ status: 'PENDING', attempts: 0 })

      expect(await deliverDue({ restaurantId: restaurant.id, now: later })).toMatchObject({ sent: 2 })
      const rows = await outbox(tx, restaurant.id)
      expect(rows.map((row) => [row.orderId, row.status])).toEqual([
        [bill, 'SENT'],
        [addition, 'SENT'],
      ])
      expect(rows[1]?.lastAnswer).toMatch(/on bill #\d+/)
    }))

  it('holds a change until its ticket is sent, then sends it with the ticket’s POS id', () =>
    withRollback(async (tx) => {
      const { place: restaurant, waiter, manager, orderId } = await queued(tx)
      const line = await tx.orderLine.findFirstOrThrow({ where: { orderId }, select: { id: true } })
      signInAs(waiter)
      await removeLine({ lineId: line.id, quantity: 1, reason: 'mistake' })
      await tx.posOutbox.updateMany({ where: { orderId, kind: 'TICKET' }, data: { status: 'FAILED' } })
      expect(await deliverDue({ restaurantId: restaurant.id })).toMatchObject({ sent: 0 })

      signInAs(manager)
      expect(await retryPosNow(restaurant.id)).toMatchObject({ ok: true, requeued: 1, sent: 2 })
      const change = first((await outbox(tx, restaurant.id)).filter((row) => row.kind === 'CHANGE'))
      expect(change).toMatchObject({ status: 'SENT', lastAnswer: `Received a remove on tpos-ticket-${orderId}` })
    }))
})

describe('two workers', () => {
  it('never claim the same row at once: the second skips what the first holds, without waiting', async () => {
    // Committed rows, on two real connections: a rolled-back test transaction cannot show a lock
    // held by another session. Removed at the end with the restaurant (the delete cascades).
    const code = newRestaurantCode()
    const restaurant = await db.restaurant.create({ data: { name: 'POS lock test', slug: `pos-lock-${code.toLowerCase()}`, code, defaultLocale: 'en' }, select: { id: true } })
    try {
      const sealed = sealCredentials({ apiKey: 'test_demo_key' }, restaurant.id)
      const made = await db.posConnection.create({ data: { restaurantId: restaurant.id, provider: 'test-pos', status: 'ACTIVE', externalLocationId: LOCATION, credentials: sealed.credentials, credentialsKeyId: sealed.keyId }, select: { id: true } })
      const order = await db.order.create({ data: { restaurantId: restaurant.id, number: 1, table: '1', phone: '', subtotal: '0.00' }, select: { id: true } })
      const row = await db.posOutbox.create({ data: { connectionId: made.id, restaurantId: restaurant.id, orderId: order.id, billId: order.id, kind: 'TICKET', nextAttemptAt: new Date(Date.now() - MINUTE) }, select: { id: true } })
      const scope = { restaurantId: restaurant.id, now: new Date(), limit: 10 }

      await db.$transaction(
        async (first) => {
          expect((await claimDue(first, scope)).ids).toEqual([row.id])
          const second = await db.$transaction(async (other) => {
            // Without SKIP LOCKED this would wait on the first worker's lock: fail fast instead.
            await other.$executeRaw`SET LOCAL lock_timeout = '2s'`
            return claimDue(other, scope)
          })
          expect(second.ids).toEqual([])
        },
        { timeout: 20_000 },
      )
      expect(await db.posOutbox.findUniqueOrThrow({ where: { id: row.id }, select: { attempts: true } })).toEqual({ attempts: 1 })
    } finally {
      await db.restaurant.delete({ where: { id: restaurant.id } })
    }
  })
})
