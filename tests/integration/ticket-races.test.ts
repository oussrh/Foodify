import { afterEach, describe, expect, it, vi } from 'vitest'
import { closeBill } from '@/app/actions/bill-actions'
import { setOrderStatus } from '@/app/actions/order-actions'
import { cancelTicket, decideRequest, removeLine } from '@/app/actions/ticket-actions'
import { voidLine } from '@/app/actions/void-actions'
import { currentTx, withRollback } from './db'
import { floor, lineOf, state, ticket } from './bill-fixtures'
import { signInAs } from './session'

// What happens to a ticket when two screens act on it: the board's own moves are decided on the
// row read again under the lock, a request stops applying once the food is made or the bill is
// closed, and a closed bill is final for everyone but a manager's void.

afterEach(() => vi.restoreAllMocks())

/**
 * Runs `between` right after the first read of an order by the code under test, as a second
 * screen would act between that read and the write that follows it.
 */
function actBetweenReadAndWrite(between: () => Promise<unknown>) {
  const orders = currentTx().order
  const read = orders.findUnique.bind(orders)
  let done = false
  vi.spyOn(orders, 'findUnique').mockImplementation(((args: Parameters<typeof read>[0]) =>
    read(args).then(async (row) => {
      if (!done) {
        done = true
        await between()
      }
      return row
    })) as unknown as typeof orders.findUnique)
}

describe('the board’s moves under the lock', () => {
  it('does not bring back a ticket cancelled between the tablet’s read and its Start', () =>
    withRollback(async (tx) => {
      const { place, kitchen } = await floor(tx)
      const sent = await ticket(tx, place.id)
      signInAs(kitchen)
      actBetweenReadAndWrite(() => tx.order.update({ where: { id: sent.id }, data: { status: 'CANCELLED' } }))

      expect(await setOrderStatus({ orderId: sent.id, action: 'accept' })).toEqual({ id: sent.id, status: 'CANCELLED' })
      expect((await state(tx, sent.id)).status).toBe('CANCELLED')
    }))

  it('answers the floor’s open request, refused, when the ticket is called up, and Accept then changes nothing', () =>
    withRollback(async (tx) => {
      const { place, waiter, kitchen } = await floor(tx)
      const sent = await ticket(tx, place.id, { status: 'ACCEPTED' })
      signInAs(waiter)
      const asked = await removeLine({ lineId: lineOf(sent, 'Tea'), quantity: 1, reason: 'mistake' })
      if (!asked.ok) throw new Error('refused')

      signInAs(kitchen)
      await setOrderStatus({ orderId: sent.id, action: 'ready' })
      expect(await tx.orderChange.findUniqueOrThrow({ where: { id: asked.changeId } })).toMatchObject({ status: 'REFUSED', decidedById: kitchen.id })
      expect(await decideRequest({ changeId: asked.changeId, accept: true })).toEqual({ ok: false, refused: 'decided' })
      expect(await state(tx, sent.id)).toMatchObject({ status: 'READY', subtotal: '10.50', lines: [{ removedQuantity: 0 }, { removedQuantity: 0 }] })
    }))

  it('refuses as stale a request on a ticket that left the kitchen by any other way', () =>
    withRollback(async (tx) => {
      const { place, waiter, kitchen } = await floor(tx)
      const sent = await ticket(tx, place.id, { status: 'ACCEPTED' })
      signInAs(waiter)
      const asked = await cancelTicket({ orderId: sent.id, reason: 'too_slow' })
      if (!asked.ok) throw new Error('refused')
      await tx.order.update({ where: { id: sent.id }, data: { status: 'DONE' } })

      signInAs(kitchen)
      expect(await decideRequest({ changeId: asked.changeId, accept: true })).toEqual({ ok: false, refused: 'not_cooking', answered: [asked.changeId] })
      expect((await state(tx, sent.id)).status).toBe('DONE')
      expect((await tx.orderChange.findUniqueOrThrow({ where: { id: asked.changeId } })).status).toBe('REFUSED')
    }))
})

describe('a closed bill is final', () => {
  it('answers its open requests on close, and refuses the floor afterwards', () =>
    withRollback(async (tx) => {
      const { place, waiter, kitchen } = await floor(tx)
      const bill = await ticket(tx, place.id, { status: 'DONE' })
      const added = await ticket(tx, place.id, { status: 'ACCEPTED', parentId: bill.id })
      signInAs(waiter)
      const asked = await removeLine({ lineId: lineOf(added, 'Tea'), quantity: 1, reason: 'mistake' })
      if (!asked.ok) throw new Error('refused')

      expect(await closeBill({ billId: bill.id, force: true })).toMatchObject({ ok: true, answered: [asked.changeId] })
      expect((await tx.orderChange.findUniqueOrThrow({ where: { id: asked.changeId } })).status).toBe('REFUSED')
      expect(await removeLine({ lineId: lineOf(added, 'Mint'), quantity: 1, reason: 'mistake' })).toEqual({ ok: false, refused: 'bill_closed' })
      expect(await cancelTicket({ orderId: bill.id, reason: 'mistake' })).toEqual({ ok: false, refused: 'bill_closed' })

      signInAs(kitchen)
      expect(await decideRequest({ changeId: asked.changeId, accept: true })).toEqual({ ok: false, refused: 'decided' })
    }))

  it('refuses a request still pending when its bill was closed by another way, as stale', () =>
    withRollback(async (tx) => {
      const { place, waiter, kitchen } = await floor(tx)
      const bill = await ticket(tx, place.id, { status: 'ACCEPTED' })
      signInAs(waiter)
      const asked = await cancelTicket({ orderId: bill.id, reason: 'mistake' })
      if (!asked.ok) throw new Error('refused')
      await tx.order.update({ where: { id: bill.id }, data: { closedAt: new Date() } })

      signInAs(kitchen)
      expect(await decideRequest({ changeId: asked.changeId, accept: true })).toEqual({ ok: false, refused: 'bill_closed', answered: [asked.changeId] })
      expect((await state(tx, bill.id)).status).toBe('ACCEPTED')
    }))

  it('still takes a manager’s void on a served dish: a refund', () =>
    withRollback(async (tx) => {
      const { place, manager } = await floor(tx)
      const bill = await ticket(tx, place.id, { status: 'DONE', closedAt: new Date() })
      signInAs(manager)
      expect(await voidLine({ lineId: lineOf(bill, 'Mint'), quantity: 2, reason: 'too_slow' })).toMatchObject({ ok: true, subtotal: '2.50' })
    }))
})

describe('a manager before the food has left the kitchen', () => {
  it('cancels or removes like the floor, and cannot void', () =>
    withRollback(async (tx) => {
      const { place, manager } = await floor(tx)
      const waiting = await ticket(tx, place.id)
      const cooking = await ticket(tx, place.id, { status: 'ACCEPTED' })
      signInAs(manager)
      expect(await voidLine({ lineId: lineOf(waiting, 'Tea'), quantity: 1, reason: 'mistake' })).toEqual({ ok: false, refused: 'not_served' })
      expect(await voidLine({ lineId: lineOf(cooking, 'Tea'), quantity: 1, reason: 'mistake' })).toEqual({ ok: false, refused: 'not_served' })
      expect(await removeLine({ lineId: lineOf(waiting, 'Tea'), quantity: 1, reason: 'mistake' })).toMatchObject({ ok: true, outcome: 'applied' })
      expect(await removeLine({ lineId: lineOf(cooking, 'Tea'), quantity: 1, reason: 'mistake' })).toMatchObject({ ok: true, outcome: 'requested' })
    }))
})
