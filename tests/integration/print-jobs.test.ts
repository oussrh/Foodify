import { describe, expect, it } from 'vitest'
import { place, posFloor } from './pos-fixtures'
import { reprintTicket, setOrderStatus } from '@/app/actions/order-actions'
import { decideRequest, removeLine } from '@/app/actions/ticket-actions'
import { voidLine } from '@/app/actions/void-actions'
import { withRollback, type Tx } from './db'
import { first, ticket } from './bill-fixtures'
import { signInAs } from './session'

// What the kitchen's printers are owed, written in the same transaction as the event
// (server/print/enqueue.ts), on the real database: a ticket on every printer at the moment the
// restaurant prints at, and a cancel slip only where the ticket was printed.

const guestOrder = (restaurantId: string, dishId: string) => ({ restaurantId, table: '4', phone: '+212600112233', lines: [{ dishId, quantity: 2 }] })

let printers = 0
/** A printer of `restaurantId`. */
const printer = (tx: Tx, restaurantId: string) => tx.printer.create({ data: { restaurantId, name: 'Pass', tokenHash: `hash-${++printers}-${Date.now()}` }, select: { id: true } })

/** The restaurant's print jobs, oldest first. */
const jobs = (tx: Tx, restaurantId: string) =>
  tx.printJob.findMany({ where: { printer: { restaurantId } }, orderBy: { seq: 'asc' }, select: { printerId: true, orderId: true, changeId: true, kind: true, status: true } })

describe('a restaurant that prints on arrival', () => {
  it('queues nothing without a printer', () =>
    withRollback(async (tx) => {
      const { place: restaurant, harira } = await posFloor(tx)
      await place(guestOrder(restaurant.id, harira.id))
      expect(await tx.printJob.count()).toBe(0)
    }))

  it('queues the ticket on every printer as it is placed, and nothing more when it is accepted', () =>
    withRollback(async (tx) => {
      const { place: restaurant, harira, kitchen } = await posFloor(tx)
      const pass = await printer(tx, restaurant.id)
      const bar = await printer(tx, restaurant.id)
      const orderId = await place(guestOrder(restaurant.id, harira.id))
      signInAs(kitchen)
      await setOrderStatus({ orderId, action: 'accept' })
      expect(await jobs(tx, restaurant.id)).toEqual([
        { printerId: pass.id, orderId, changeId: null, kind: 'TICKET', status: 'PENDING' },
        { printerId: bar.id, orderId, changeId: null, kind: 'TICKET', status: 'PENDING' },
      ])
    }))
})

describe('a restaurant that prints on accept', () => {
  it('queues the ticket when the kitchen accepts it, and no slip for one cancelled before', () =>
    withRollback(async (tx) => {
      const { place: restaurant, kitchen } = await posFloor(tx)
      await tx.restaurant.update({ where: { id: restaurant.id }, data: { printTrigger: 'ACCEPT' } })
      await printer(tx, restaurant.id)
      const accepted = await ticket(tx, restaurant.id)
      const dropped = await ticket(tx, restaurant.id)
      signInAs(kitchen)
      await setOrderStatus({ orderId: accepted.id, action: 'accept' })
      await setOrderStatus({ orderId: dropped.id, action: 'cancel' })
      expect(await jobs(tx, restaurant.id)).toMatchObject([{ orderId: accepted.id, kind: 'TICKET' }])
    }))
})

describe('cancel slips', () => {
  it('print where the ticket printed when the board cancels it', () =>
    withRollback(async (tx) => {
      const { place: restaurant, harira, kitchen } = await posFloor(tx)
      const pass = await printer(tx, restaurant.id)
      const orderId = await place(guestOrder(restaurant.id, harira.id))
      await printer(tx, restaurant.id) // added after the ticket printed: it gets no slip
      signInAs(kitchen)
      await setOrderStatus({ orderId, action: 'cancel' })
      expect((await jobs(tx, restaurant.id)).map((job) => [job.printerId, job.kind, job.changeId])).toEqual([
        [pass.id, 'TICKET', null],
        [pass.id, 'CANCEL', null],
      ])
    }))

  it('print for a dish removed, and for a request once the kitchen accepts it, naming the change', () =>
    withRollback(async (tx) => {
      const { place: restaurant, harira, waiter, kitchen } = await posFloor(tx)
      await printer(tx, restaurant.id)
      const orderId = await place(guestOrder(restaurant.id, harira.id))
      const line = await tx.orderLine.findFirstOrThrow({ where: { orderId }, select: { id: true } })
      signInAs(waiter)
      await removeLine({ lineId: line.id, quantity: 1, reason: 'mistake' })
      signInAs(kitchen)
      await setOrderStatus({ orderId, action: 'accept' })
      signInAs(waiter)
      const asked = await removeLine({ lineId: line.id, quantity: 1, reason: 'too_slow' })
      expect((await jobs(tx, restaurant.id)).filter((job) => job.kind === 'CANCEL')).toHaveLength(1)
      signInAs(kitchen)
      await decideRequest({ changeId: asked.ok ? asked.changeId : '', accept: true })
      const changes = await tx.orderChange.findMany({ where: { orderId }, orderBy: { createdAt: 'asc' }, select: { id: true } })
      expect((await jobs(tx, restaurant.id)).filter((job) => job.kind === 'CANCEL').map((job) => job.changeId)).toEqual(changes.map((change) => change.id))
    }))

  it('do not print for a manager’s void: the food was already made', () =>
    withRollback(async (tx) => {
      const { place: restaurant, harira, kitchen, manager } = await posFloor(tx)
      await printer(tx, restaurant.id)
      const orderId = await place(guestOrder(restaurant.id, harira.id))
      signInAs(kitchen)
      await setOrderStatus({ orderId, action: 'ready' })
      const line = await tx.orderLine.findFirstOrThrow({ where: { orderId }, select: { id: true } })
      signInAs(manager)
      expect(await voidLine({ lineId: line.id, quantity: 1, reason: 'mistake' })).toMatchObject({ ok: true })
      expect((await jobs(tx, restaurant.id)).map((job) => job.kind)).toEqual(['TICKET'])
    }))
})

describe('reprint', () => {
  it('queues the ticket again on every printer for the board, and refuses a waiter', () =>
    withRollback(async (tx) => {
      const { place: restaurant, kitchen, waiter } = await posFloor(tx)
      await printer(tx, restaurant.id)
      const sent = await ticket(tx, restaurant.id)
      signInAs(waiter)
      await expect(reprintTicket(sent.id)).rejects.toThrow()
      signInAs(kitchen)
      expect(await reprintTicket(sent.id)).toEqual({ ok: true })
      expect(await jobs(tx, restaurant.id)).toMatchObject([{ orderId: sent.id, kind: 'TICKET' }])
      expect(first(await jobs(tx, restaurant.id)).status).toBe('PENDING')
    }))
})
