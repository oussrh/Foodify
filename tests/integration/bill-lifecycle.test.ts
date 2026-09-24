import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { closeBill, mergeBills, moveBill, unmergeBill } from '@/app/actions/bill-actions'
import { POST as placeOrder } from '@/app/api/orders/route'
import { GET as readTab } from '@/app/api/orders/tab/route'
import { AuthError } from '@/lib/auth-guard'
import type { TableTab } from '@/lib/table-tab'
import { withRollback } from './db'
import { floor, state, ticket } from './bill-fixtures'
import { dish, restaurant } from './fixtures'
import { signInAs } from './session'

// A table's bill from its first ticket to being paid, on the real database: closed (and the next
// order at the table opening a new bill), merged with another bill of the same table and split
// off again, moved to another table. Every one of them is on record, and none reaches another
// restaurant's bills.

const tabOf = async (restaurantId: string, table: string) =>
  ((await (await readTab(new Request(`http://test/api/orders/tab?${new URLSearchParams({ restaurantId, table }).toString()}`))).json()) as { data: TableTab | null }).data

const post = (body: unknown) =>
  placeOrder(new NextRequest('http://test/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }))

describe('closing a bill', () => {
  it('closes a bill whose tickets are all served or cancelled, and the table has no current order after it', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const bill = await ticket(tx, place.id, { status: 'DONE' })
      await ticket(tx, place.id, { status: 'CANCELLED', parentId: bill.id })
      signInAs(waiter)
      expect((await tabOf(place.id, '4'))?.parent.id).toBe(bill.id)

      expect(await closeBill({ billId: bill.id })).toMatchObject({ ok: true })

      const row = await tx.order.findUniqueOrThrow({ where: { id: bill.id }, select: { closedAt: true, closedById: true } })
      expect(row.closedAt).toBeInstanceOf(Date)
      expect(row.closedById).toBe(waiter.id)
      expect(await tabOf(place.id, '4')).toBeNull()
      expect(await tx.orderChange.findFirstOrThrow({ where: { orderId: bill.id } })).toMatchObject({ kind: 'CLOSE', status: 'APPLIED', quantity: null })
      // Closed once: a second close is told so.
      expect(await closeBill({ billId: bill.id })).toEqual({ ok: false, refused: 'closed' })
    }))

  it('answers how many dishes are still in the kitchen, and closes on the waiter’s "close anyway"', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const bill = await ticket(tx, place.id, { status: 'DONE' })
      await ticket(tx, place.id, { status: 'ACCEPTED', parentId: bill.id })
      signInAs(waiter)

      expect(await closeBill({ billId: bill.id })).toEqual({ ok: false, refused: 'in_kitchen', dishes: 3 })
      expect((await state(tx, bill.id)).closedAt).toBeNull()

      expect(await closeBill({ billId: bill.id, force: true })).toMatchObject({ ok: true })
      expect((await state(tx, bill.id)).closedAt).toBeInstanceOf(Date)
      expect(await tx.orderChange.findFirstOrThrow({ where: { orderId: bill.id } })).toMatchObject({ kind: 'CLOSE', quantity: 3 })
    }))

  it('starts a new bill with the next order at the table, and refuses an addition to the closed one', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const only = await dish(tx, place.id)
      const bill = await ticket(tx, place.id, { status: 'DONE' })
      signInAs(waiter)
      await closeBill({ billId: bill.id })

      const refused = await post({ restaurantId: place.id, table: '4', phone: '', addTo: bill.id, lines: [{ dishId: only.id, quantity: 1 }] })
      expect(refused.status).toBe(409)
      await expect(refused.json()).resolves.toMatchObject({ details: { addTo: 'closed' } })

      const res = await post({ restaurantId: place.id, table: '4', phone: '', lines: [{ dishId: only.id, quantity: 1 }] })
      expect(res.status).toBe(201)
      const { data } = (await res.json()) as { data: { id: string } }
      expect((await state(tx, data.id)).parentId).toBeNull()
      expect((await tabOf(place.id, '4'))?.parent.id).toBe(data.id)
    }))

  it('is not a kitchen tablet’s to do', () =>
    withRollback(async (tx) => {
      const { place, kitchen } = await floor(tx)
      const bill = await ticket(tx, place.id, { status: 'DONE' })
      signInAs(kitchen)
      await expect(closeBill({ billId: bill.id })).rejects.toBeInstanceOf(AuthError)
    }))
})

describe('merging two bills of one table', () => {
  it('makes the second part of the first, lists it as mergeable before and un-mergeable after, and undoes it exactly', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const first = await ticket(tx, place.id, { status: 'DONE', minutesAgo: 60 })
      const firstAdded = await ticket(tx, place.id, { status: 'ACCEPTED', parentId: first.id, minutesAgo: 30 })
      const second = await ticket(tx, place.id, { status: 'ACCEPTED', minutesAgo: 20 })
      const secondAdded = await ticket(tx, place.id, { status: 'NEW', parentId: second.id, minutesAgo: 5 })
      signInAs(waiter)
      // The table's current bill is the later one; the earlier is offered to merge with.
      const before = await tabOf(place.id, '4')
      expect(before?.parent.id).toBe(second.id)
      expect(before?.others).toEqual([expect.objectContaining({ id: first.id, number: first.number, total: '21.00' })])

      expect(await mergeBills({ billId: second.id, intoId: first.id })).toEqual({ ok: true, intoNumber: first.number })
      const merged = await tabOf(place.id, '4')
      expect(merged?.parent.id).toBe(first.id)
      expect(merged?.additions.map((a) => a.id).sort()).toEqual([firstAdded.id, second.id, secondAdded.id].sort())
      expect(merged?.merged).toEqual([{ id: second.id, number: second.number }])
      expect(merged?.others).toEqual([])
      expect(merged?.total).toBe('42.00')
      // The kitchen is not disturbed: each ticket keeps its status.
      expect((await state(tx, second.id)).status).toBe('ACCEPTED')
      expect((await state(tx, secondAdded.id)).status).toBe('NEW')

      // An addition sent to the merged bill afterwards stays with it through the undo.
      const later = await ticket(tx, place.id, { parentId: first.id, minutesAgo: 1 })
      expect(await unmergeBill({ billId: second.id })).toEqual({ ok: true, number: second.number })
      expect((await state(tx, second.id)).parentId).toBeNull()
      expect((await state(tx, secondAdded.id)).parentId).toBe(second.id)
      expect((await state(tx, firstAdded.id)).parentId).toBe(first.id)
      expect((await state(tx, later.id)).parentId).toBe(first.id)
      const kinds = await tx.orderChange.findMany({ where: { restaurantId: place.id }, select: { kind: true, orderId: true }, orderBy: { createdAt: 'asc' } })
      expect(kinds).toEqual(expect.arrayContaining([{ kind: 'MERGE', orderId: first.id }, { kind: 'MERGE', orderId: secondAdded.id }, { kind: 'UNMERGE', orderId: first.id }]))
      // Undone once: there is nothing left to undo.
      expect(await unmergeBill({ billId: second.id })).toEqual({ ok: false, refused: 'not_merged' })
    }))

  it('cannot be undone once the bill is closed', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const first = await ticket(tx, place.id, { status: 'DONE', minutesAgo: 60 })
      const second = await ticket(tx, place.id, { status: 'DONE', minutesAgo: 20 })
      signInAs(waiter)
      await mergeBills({ billId: second.id, intoId: first.id })
      await closeBill({ billId: first.id })
      expect(await unmergeBill({ billId: second.id })).toEqual({ ok: false, refused: 'closed' })
    }))

  it('refuses a bill at another table, a closed one and an addition', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const first = await ticket(tx, place.id)
      const elsewhere = await ticket(tx, place.id, { table: '5' })
      const closed = await ticket(tx, place.id, { closedAt: new Date() })
      const addition = await ticket(tx, place.id, { parentId: first.id })
      signInAs(waiter)
      expect(await mergeBills({ billId: elsewhere.id, intoId: first.id })).toEqual({ ok: false, refused: 'other_table' })
      expect(await mergeBills({ billId: closed.id, intoId: first.id })).toEqual({ ok: false, refused: 'closed' })
      expect(await mergeBills({ billId: addition.id, intoId: first.id })).toEqual({ ok: false, refused: 'not_a_parent' })
      expect(await tx.orderChange.count({ where: { restaurantId: place.id } })).toBe(0)
    }))
})

describe('moving a bill', () => {
  it('moves the bill and every ticket of it to a free table, on record', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const bill = await ticket(tx, place.id)
      const added = await ticket(tx, place.id, { parentId: bill.id })
      signInAs(waiter)

      expect(await moveBill({ billId: bill.id, table: '9' })).toEqual({ ok: true, table: '9', mergedInto: null })
      expect((await state(tx, bill.id)).table).toBe('9')
      expect((await state(tx, added.id)).table).toBe('9')
      expect(await tx.orderChange.findFirstOrThrow({ where: { orderId: bill.id } })).toMatchObject({ kind: 'MOVE', fromTable: '4', toTable: '9' })
      expect(await tabOf(place.id, '4')).toBeNull()
    }))

  it('refuses a table with an open bill, naming it, and moves and merges when asked to', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const bill = await ticket(tx, place.id)
      const there = await ticket(tx, place.id, { table: '9', minutesAgo: 30 })
      signInAs(waiter)

      expect(await moveBill({ billId: bill.id, table: '9' })).toEqual({ ok: false, refused: 'occupied', openBill: { id: there.id, number: there.number } })
      expect((await state(tx, bill.id)).table).toBe('4')

      expect(await moveBill({ billId: bill.id, table: '9', mergeInto: there.id })).toEqual({ ok: true, table: '9', mergedInto: there.number })
      expect(await state(tx, bill.id)).toMatchObject({ table: '9', parentId: there.id })
    }))
})

describe('another restaurant’s bills', () => {
  it('read as not found to a close, a merge, an undo and a move', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const mine = await ticket(tx, place.id)
      const theirs = await restaurant(tx)
      const foreign = await ticket(tx, theirs.id, { status: 'DONE' })
      signInAs(waiter)

      await expect(closeBill({ billId: foreign.id })).rejects.toBeInstanceOf(AuthError)
      await expect(mergeBills({ billId: mine.id, intoId: foreign.id })).rejects.toBeInstanceOf(AuthError)
      await expect(unmergeBill({ billId: foreign.id })).rejects.toBeInstanceOf(AuthError)
      await expect(moveBill({ billId: foreign.id, table: '9' })).rejects.toBeInstanceOf(AuthError)
      // Naming theirs as the bill merged into mine is refused as not found, and moves nothing.
      expect(await mergeBills({ billId: foreign.id, intoId: mine.id })).toEqual({ ok: false, refused: 'not_found' })
      expect(await state(tx, foreign.id)).toMatchObject({ parentId: null, closedAt: null, table: '4' })
    }))
})
