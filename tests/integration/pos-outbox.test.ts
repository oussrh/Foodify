import { describe, expect, it } from 'vitest'
import { connection, outbox, place, posFloor } from './pos-fixtures'
import { closeBill } from '@/app/actions/bill-actions'
import { setOrderStatus } from '@/app/actions/order-actions'
import { decideRequest, removeLine } from '@/app/actions/ticket-actions'
import { withRollback } from './db'
import { first, ticket } from './bill-fixtures'
import { signInAs } from './session'

// What the POS is owed, written in the same transaction as the event (server/pos/enqueue.ts), on
// the real database: nothing at all for a restaurant without an active connection, and exactly
// one row per ticket, addition, applied change and close for one that has it. Nothing is sent
// here: the triggers are off in this suite (setup.ts), and pos-delivery.test.ts sends.

const guestOrder = (restaurantId: string, dishId: string) => ({ restaurantId, table: '4', phone: '+212600112233', lines: [{ dishId, quantity: 2 }] })

describe('a restaurant without an active POS', () => {
  it('queues nothing when an order is placed', () =>
    withRollback(async (tx) => {
      const { place: restaurant, harira } = await posFloor(tx)
      await place(guestOrder(restaurant.id, harira.id))
      expect(await tx.posOutbox.count()).toBe(0)
    }))

  it('queues nothing before the connection is activated', () =>
    withRollback(async (tx) => {
      const matching = await posFloor(tx)
      await connection(tx, matching.place.id, { status: 'MAPPING' })
      await place(guestOrder(matching.place.id, matching.harira.id))
      expect(await tx.posOutbox.count()).toBe(0)
    }))
})

describe('a restaurant whose POS is paused or needs attention', () => {
  it('keeps queueing, for the owner to send or discard on Resume', () =>
    withRollback(async (tx) => {
      const paused = await posFloor(tx)
      await connection(tx, paused.place.id, { status: 'PAUSED' })
      const one = await place(guestOrder(paused.place.id, paused.harira.id))
      const failing = await posFloor(tx)
      await connection(tx, failing.place.id, { status: 'ERROR' })
      const two = await place(guestOrder(failing.place.id, failing.harira.id))
      expect(await outbox(tx, paused.place.id)).toMatchObject([{ kind: 'TICKET', status: 'PENDING', orderId: one }])
      expect(await outbox(tx, failing.place.id)).toMatchObject([{ kind: 'TICKET', status: 'PENDING', orderId: two }])
    }))
})

describe('a restaurant whose POS is active', () => {
  it('queues one TICKET for a new order, as its own bill', () =>
    withRollback(async (tx) => {
      const { place: restaurant, harira } = await posFloor(tx)
      await connection(tx, restaurant.id)
      const orderId = await place(guestOrder(restaurant.id, harira.id))
      expect(await outbox(tx, restaurant.id)).toMatchObject([{ kind: 'TICKET', status: 'PENDING', orderId, billId: orderId, changeId: null, attempts: 0 }])
    }))

  it('queues one TICKET for an addition, on its bill, and nothing for an addition refused', () =>
    withRollback(async (tx) => {
      const { place: restaurant, harira, waiter } = await posFloor(tx)
      await connection(tx, restaurant.id)
      const bill = await place(guestOrder(restaurant.id, harira.id))
      signInAs(waiter)
      const addition = await place({ restaurantId: restaurant.id, table: '4', addTo: bill, lines: [{ dishId: harira.id, quantity: 1 }] })
      await expect(place({ restaurantId: restaurant.id, table: '9', addTo: bill, lines: [{ dishId: harira.id, quantity: 1 }] })).rejects.toThrow(/409/)
      expect((await outbox(tx, restaurant.id)).map((row) => [row.kind, row.orderId, row.billId])).toEqual([
        ['TICKET', bill, bill],
        ['TICKET', addition, bill],
      ])
    }))

  it('queues one CHANGE for a dish removed, naming the change', () =>
    withRollback(async (tx) => {
      const { place: restaurant, waiter } = await posFloor(tx)
      await connection(tx, restaurant.id)
      const sent = await ticket(tx, restaurant.id)
      signInAs(waiter)
      await removeLine({ lineId: first(sent.lines).id, quantity: 1, reason: 'mistake' })
      const change = await tx.orderChange.findFirstOrThrow({ where: { orderId: sent.id } })
      expect(await outbox(tx, restaurant.id)).toMatchObject([{ kind: 'CHANGE', orderId: sent.id, billId: sent.id, changeId: change.id }])
    }))

  it('queues a request only once the kitchen accepts it', () =>
    withRollback(async (tx) => {
      const { place: restaurant, waiter, kitchen } = await posFloor(tx)
      await connection(tx, restaurant.id)
      const cooking = await ticket(tx, restaurant.id, { status: 'ACCEPTED' })
      signInAs(waiter)
      const asked = await removeLine({ lineId: first(cooking.lines).id, quantity: 1, reason: 'too_slow' })
      expect(asked).toMatchObject({ ok: true, outcome: 'requested' })
      expect(await tx.posOutbox.count()).toBe(0)
      signInAs(kitchen)
      await decideRequest({ changeId: asked.ok ? asked.changeId : '', accept: true })
      expect(await outbox(tx, restaurant.id)).toMatchObject([{ kind: 'CHANGE', orderId: cooking.id, changeId: asked.ok ? asked.changeId : '' }])
    }))

  it('queues one CHANGE when the board cancels a ticket, with no change row of its own', () =>
    withRollback(async (tx) => {
      const { place: restaurant, kitchen } = await posFloor(tx)
      await connection(tx, restaurant.id)
      const sent = await ticket(tx, restaurant.id)
      signInAs(kitchen)
      await setOrderStatus({ orderId: sent.id, action: 'accept' })
      expect(await tx.posOutbox.count()).toBe(0)
      await setOrderStatus({ orderId: sent.id, action: 'cancel' })
      expect(await outbox(tx, restaurant.id)).toMatchObject([{ kind: 'CHANGE', orderId: sent.id, changeId: null }])
    }))

  it('queues one CLOSE when staff close the bill', () =>
    withRollback(async (tx) => {
      const { place: restaurant, waiter } = await posFloor(tx)
      await connection(tx, restaurant.id)
      const bill = await ticket(tx, restaurant.id, { status: 'DONE' })
      signInAs(waiter)
      expect(await closeBill({ billId: bill.id })).toMatchObject({ ok: true })
      expect(await closeBill({ billId: bill.id })).toMatchObject({ ok: false })
      expect(await outbox(tx, restaurant.id)).toMatchObject([{ kind: 'CLOSE', orderId: bill.id, billId: bill.id }])
    }))
})
