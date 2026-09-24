import { describe, expect, it } from 'vitest'
import { setOrderStatus } from '@/app/actions/order-actions'
import { cancelTicket, decideRequest, removeLine } from '@/app/actions/ticket-actions'
import { readChangeLog, voidLine, voidTicket } from '@/app/actions/void-actions'
import { GET as boardOrders } from '@/app/api/orders/board/route'
import { GET as readTab } from '@/app/api/orders/tab/route'
import { AuthError } from '@/lib/auth-guard'
import type { BoardOrder } from '@/lib/orders'
import type { TableTab } from '@/lib/table-tab'
import { withRollback } from './db'
import { first, floor, lineOf, state, ticket } from './bill-fixtures'
import { restaurant, waiter as waiterOf } from './fixtures'
import { signInAs } from './session'

// Taking something off a ticket after it went to the kitchen, on the real database: the floor
// does it at once while the kitchen has not started, asks once it is cooking, and cannot once it
// has left the kitchen, where a manager voids it. Nothing is deleted, and every change is on record.

const tabOf = async (restaurantId: string, table: string) =>
  ((await (await readTab(new Request(`http://test/api/orders/tab?${new URLSearchParams({ restaurantId, table }).toString()}`))).json()) as { data: TableTab | null }).data

const boardOf = async (restaurantId: string) =>
  ((await (await boardOrders(new Request(`http://test/api/orders/board?restaurantId=${restaurantId}`))).json()) as { data: BoardOrder[] }).data

describe('the floor on a ticket the kitchen has not started', () => {
  it('cancels it at once, with the reason on record', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const sent = await ticket(tx, place.id)
      signInAs(waiter)

      const result = await cancelTicket({ orderId: sent.id, reason: 'changed_mind' })

      expect(result).toMatchObject({ ok: true, outcome: 'applied', status: 'CANCELLED' })
      expect((await state(tx, sent.id)).status).toBe('CANCELLED')
      const record = await tx.orderChange.findFirstOrThrow({ where: { orderId: sent.id } })
      expect(record).toMatchObject({ kind: 'CANCEL', status: 'APPLIED', reason: 'changed_mind', requestedById: waiter.id, lineId: null })
    }))

  it('removes one of a dish, keeps the line and recomputes the subtotal', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const sent = await ticket(tx, place.id)
      const mint = lineOf(sent, 'Mint')
      signInAs(waiter)

      const result = await removeLine({ lineId: mint, quantity: 1, reason: 'other', note: 'Wrong one' })

      expect(result).toMatchObject({ ok: true, outcome: 'applied', status: 'NEW', subtotal: '6.50' })
      expect(await state(tx, sent.id)).toMatchObject({ subtotal: '6.50', lines: [{ nameEn: 'Tea', quantity: 1, removedQuantity: 0 }, { nameEn: 'Mint', quantity: 2, removedQuantity: 1 }] })
      expect(await tx.orderChange.findFirstOrThrow({ where: { lineId: mint } })).toMatchObject({ kind: 'REMOVE', quantity: 1, reason: 'other', note: 'Wrong one' })
    }))

  it('cancels a ticket whose last dish is removed, and refuses more than is left', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const sent = await ticket(tx, place.id, { lines: [{ nameEn: 'Tea', unitPrice: '2.50', quantity: 2 }] })
      signInAs(waiter)

      expect(await removeLine({ lineId: first(sent.lines).id, quantity: 3, reason: 'mistake' })).toEqual({ ok: false, refused: 'too_many' })
      expect(await removeLine({ lineId: first(sent.lines).id, quantity: 2, reason: 'mistake' })).toMatchObject({ ok: true, status: 'CANCELLED', subtotal: '0.00' })
      expect(await state(tx, sent.id)).toMatchObject({ status: 'CANCELLED', lines: [{ quantity: 2, removedQuantity: 2 }] })
    }))

  it('refuses a reason of other with no note before anything is read', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const sent = await ticket(tx, place.id)
      signInAs(waiter)
      await expect(cancelTicket({ orderId: sent.id, reason: 'other' })).rejects.toThrow()
      expect((await state(tx, sent.id)).status).toBe('NEW')
    }))
})

describe('a ticket being cooked: the floor asks, the kitchen answers', () => {
  it('turns a cancel into a request the board shows, and the kitchen accepting it cancels the ticket', () =>
    withRollback(async (tx) => {
      const { place, waiter, kitchen } = await floor(tx)
      const sent = await ticket(tx, place.id, { status: 'ACCEPTED' })
      signInAs(waiter)

      const asked = await cancelTicket({ orderId: sent.id, reason: 'too_slow' })
      expect(asked).toMatchObject({ ok: true, outcome: 'requested', status: 'ACCEPTED' })
      expect((await state(tx, sent.id)).status).toBe('ACCEPTED')
      // A second request on the same ticket waits for the first.
      expect(await cancelTicket({ orderId: sent.id, reason: 'too_slow' })).toEqual({ ok: false, refused: 'pending' })

      signInAs(kitchen)
      const card = first((await boardOf(place.id)).filter((order) => order.id === sent.id))
      expect(card.requests).toEqual([expect.objectContaining({ kind: 'CANCEL', lineId: null, reason: 'too_slow' })])

      expect(await decideRequest({ changeId: first(card.requests).id, accept: true })).toEqual({ ok: true, status: 'APPLIED', orderStatus: 'CANCELLED', answered: [first(card.requests).id] })
      expect((await state(tx, sent.id)).status).toBe('CANCELLED')
      expect(await tx.orderChange.findUniqueOrThrow({ where: { id: first(card.requests).id } })).toMatchObject({ status: 'APPLIED', decidedById: kitchen.id })
      // Answered once: a second tap on another tablet changes nothing.
      expect(await decideRequest({ changeId: first(card.requests).id, accept: false })).toEqual({ ok: false, refused: 'decided' })
    }))

  it('leaves the ticket as it was when the kitchen refuses a removal, and tells the waiter', () =>
    withRollback(async (tx) => {
      const { place, waiter, kitchen } = await floor(tx)
      const sent = await ticket(tx, place.id, { status: 'ACCEPTED' })
      const tea = lineOf(sent, 'Tea')
      signInAs(waiter)
      const asked = await removeLine({ lineId: tea, quantity: 1, reason: 'changed_mind' })
      if (!asked.ok) throw new Error('refused')

      signInAs(kitchen)
      expect(await decideRequest({ changeId: asked.changeId, accept: false })).toEqual({ ok: true, status: 'REFUSED', orderStatus: 'ACCEPTED', answered: [asked.changeId] })
      expect(await state(tx, sent.id)).toMatchObject({ subtotal: '10.50', lines: [{ nameEn: 'Tea', removedQuantity: 0 }, { nameEn: 'Mint', removedQuantity: 0 }] })

      signInAs(waiter)
      const tab = await tabOf(place.id, '4')
      expect(tab?.answers).toEqual([expect.objectContaining({ orderId: sent.id, kind: 'REMOVE', dish: 'Tea', quantity: 1, accepted: false })])
      expect(tab?.parent.requests).toEqual([])
    }))

  it('applies an accepted removal: the line is struck, the subtotal drops', () =>
    withRollback(async (tx) => {
      const { place, waiter, manager } = await floor(tx)
      const sent = await ticket(tx, place.id, { status: 'ACCEPTED' })
      const mint = lineOf(sent, 'Mint')
      signInAs(waiter)
      const asked = await removeLine({ lineId: mint, quantity: 2, reason: 'unavailable' })
      if (!asked.ok) throw new Error('refused')
      // The tab shows the request on the ticket until it is answered.
      expect((await tabOf(place.id, '4'))?.parent.requests).toEqual([expect.objectContaining({ kind: 'REMOVE', lineId: mint, quantity: 2 })])

      // A manager answers from the board as the kitchen would.
      signInAs(manager)
      expect(await decideRequest({ changeId: asked.changeId, accept: true })).toMatchObject({ ok: true, status: 'APPLIED' })
      expect(await state(tx, sent.id)).toMatchObject({ status: 'ACCEPTED', subtotal: '2.50', lines: [{ nameEn: 'Tea', removedQuantity: 0 }, { nameEn: 'Mint', removedQuantity: 2 }] })
    }))

  it('never lets a waiter answer a request', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const sent = await ticket(tx, place.id, { status: 'ACCEPTED' })
      signInAs(waiter)
      const asked = await cancelTicket({ orderId: sent.id, reason: 'mistake' })
      if (!asked.ok) throw new Error('refused')

      await expect(decideRequest({ changeId: asked.changeId, accept: true })).rejects.toBeInstanceOf(AuthError)
      expect(await tx.orderChange.findUniqueOrThrow({ where: { id: asked.changeId } })).toMatchObject({ status: 'PENDING', decidedById: null })
    }))

  it('answers a request still open when the pass cancels the ticket itself', () =>
    withRollback(async (tx) => {
      const { place, waiter, kitchen } = await floor(tx)
      const sent = await ticket(tx, place.id, { status: 'ACCEPTED' })
      signInAs(waiter)
      const asked = await removeLine({ lineId: lineOf(sent, 'Tea'), quantity: 1, reason: 'mistake' })
      if (!asked.ok) throw new Error('refused')

      signInAs(kitchen)
      await setOrderStatus({ orderId: sent.id, action: 'cancel' })
      expect(await tx.orderChange.findUniqueOrThrow({ where: { id: asked.changeId } })).toMatchObject({ status: 'REFUSED', decidedById: kitchen.id })
    }))

  it('keeps a kitchen tablet from cancelling through the floor’s action', () =>
    withRollback(async (tx) => {
      const { place, kitchen } = await floor(tx)
      const sent = await ticket(tx, place.id)
      signInAs(kitchen)
      await expect(cancelTicket({ orderId: sent.id, reason: 'mistake' })).rejects.toBeInstanceOf(AuthError)
    }))
})

describe('a ticket that has left the kitchen', () => {
  it('is not the floor’s to change, and a waiter cannot void it', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const served = await ticket(tx, place.id, { status: 'DONE' })
      signInAs(waiter)

      expect(await removeLine({ lineId: first(served.lines).id, quantity: 1, reason: 'mistake' })).toEqual({ ok: false, refused: 'manager_only' })
      expect(await cancelTicket({ orderId: served.id, reason: 'mistake' })).toEqual({ ok: false, refused: 'manager_only' })
      await expect(voidLine({ lineId: first(served.lines).id, quantity: 1, reason: 'mistake' })).rejects.toBeInstanceOf(AuthError)
      await expect(voidTicket({ orderId: served.id, reason: 'mistake' })).rejects.toBeInstanceOf(AuthError)
      expect((await state(tx, served.id)).subtotal).toBe('10.50')
    }))

  it('is voided by a manager: the dish stays on record, the subtotal and the bill’s total drop', () =>
    withRollback(async (tx) => {
      const { place, waiter, manager } = await floor(tx)
      const served = await ticket(tx, place.id, { status: 'DONE' })
      const mint = lineOf(served, 'Mint')
      signInAs(manager)

      expect(await voidLine({ lineId: mint, quantity: 1, reason: 'too_slow' })).toMatchObject({ ok: true, outcome: 'applied', status: 'DONE', subtotal: '6.50' })
      expect(await state(tx, served.id)).toMatchObject({ lines: [{ nameEn: 'Tea', quantity: 1, removedQuantity: 0 }, { nameEn: 'Mint', quantity: 2, removedQuantity: 1 }] })

      signInAs(waiter)
      expect((await tabOf(place.id, '4'))?.total).toBe('6.50')

      signInAs(manager)
      const log = await readChangeLog({ orderId: served.id })
      expect(log).toEqual([expect.objectContaining({ kind: 'VOID', status: 'APPLIED', dish: 'Mint', quantity: 1, reason: 'too_slow', by: manager.email })])
    }))

  it('is voided whole by a manager: every line taken off, the ticket cancelled', () =>
    withRollback(async (tx) => {
      const { place, manager } = await floor(tx)
      const served = await ticket(tx, place.id, { status: 'READY' })
      signInAs(manager)

      expect(await voidTicket({ orderId: served.id, reason: 'other', note: 'Dropped on the floor' })).toMatchObject({ ok: true, status: 'CANCELLED', subtotal: '0.00' })
      expect(await state(tx, served.id)).toMatchObject({ lines: [{ removedQuantity: 1 }, { removedQuantity: 2 }] })
    }))

  it('keeps the change log from the floor', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const sent = await ticket(tx, place.id)
      signInAs(waiter)
      await expect(readChangeLog({ orderId: sent.id })).rejects.toBeInstanceOf(AuthError)
    }))
})

describe('another restaurant’s tickets', () => {
  it('read as not found for every change, whoever asks', () =>
    withRollback(async (tx) => {
      const { place, manager, kitchen } = await floor(tx)
      const theirs = await restaurant(tx)
      const foreign = await ticket(tx, theirs.id, { status: 'ACCEPTED' })
      const line = first(foreign.lines).id
      // A pending request of theirs, made by their own waiter.
      signInAs(await waiterOf(tx, [theirs.id]))
      const asked = await cancelTicket({ orderId: foreign.id, reason: 'mistake' })
      if (!asked.ok) throw new Error('refused')

      signInAs(await waiterOf(tx, [place.id]))
      await expect(cancelTicket({ orderId: foreign.id, reason: 'mistake' })).rejects.toBeInstanceOf(AuthError)
      await expect(removeLine({ lineId: line, quantity: 1, reason: 'mistake' })).rejects.toBeInstanceOf(AuthError)
      signInAs(manager)
      await expect(voidLine({ lineId: line, quantity: 1, reason: 'mistake' })).rejects.toBeInstanceOf(AuthError)
      await expect(voidTicket({ orderId: foreign.id, reason: 'mistake' })).rejects.toBeInstanceOf(AuthError)
      await expect(readChangeLog({ orderId: foreign.id })).rejects.toBeInstanceOf(AuthError)
      signInAs(kitchen)
      await expect(decideRequest({ changeId: asked.changeId, accept: true })).rejects.toBeInstanceOf(AuthError)

      expect(await state(tx, foreign.id)).toMatchObject({ status: 'ACCEPTED', lines: [{ removedQuantity: 0 }, { removedQuantity: 0 }] })
      // A made-up id is refused the same way as a foreign one.
      await expect(decideRequest({ changeId: '8f0f3d6a-1d3f-4a1b-9c2e-000000000009', accept: true })).rejects.toBeInstanceOf(AuthError)
    }))
})
