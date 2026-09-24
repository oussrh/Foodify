import { describe, expect, it } from 'vitest'
import { closeBill, mergeBills, moveBill, unmergeBill } from '@/app/actions/bill-actions'
import { GET as readTab } from '@/app/api/orders/tab/route'
import { AuthError } from '@/lib/auth-guard'
import type { TableTab } from '@/lib/table-tab'
import { withRollback } from './db'
import { floor, state, ticket } from './bill-fixtures'
import { manager as managerOf, restaurant } from './fixtures'
import { signInAs } from './session'

// A bill's edges: it is cancelled only when every ticket of it is, so a cancelled opening ticket
// with an addition still cooking leaves the bill alive; an undo is only for a merge that is still
// how things stand; and the bill actions hold against another restaurant's manager and against
// nobody at all.

const tabOf = async (restaurantId: string, table: string) =>
  ((await (await readTab(new Request(`http://test/api/orders/tab?${new URLSearchParams({ restaurantId, table }).toString()}`))).json()) as { data: TableTab | null }).data

describe('a bill whose opening ticket was cancelled while an addition is live', () => {
  it('stays the table’s current bill, with the cancelled ticket shown on it', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const bill = await ticket(tx, place.id, { status: 'CANCELLED' })
      const added = await ticket(tx, place.id, { status: 'ACCEPTED', parentId: bill.id })
      signInAs(waiter)
      const tab = await tabOf(place.id, '4')
      expect(tab?.parent).toMatchObject({ id: bill.id, status: 'CANCELLED' })
      expect(tab?.additions.map((addition) => addition.id)).toEqual([added.id])
      expect(tab?.total).toBe('10.50')
    }))

  it('can be closed, and is cancelled only once every ticket is', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const live = await ticket(tx, place.id, { status: 'CANCELLED' })
      await ticket(tx, place.id, { status: 'DONE', parentId: live.id })
      const dead = await ticket(tx, place.id, { status: 'CANCELLED', table: '5' })
      await ticket(tx, place.id, { status: 'CANCELLED', table: '5', parentId: dead.id })
      signInAs(waiter)
      expect(await closeBill({ billId: live.id })).toMatchObject({ ok: true })
      expect(await closeBill({ billId: dead.id })).toEqual({ ok: false, refused: 'cancelled' })
      expect(await tabOf(place.id, '5')).toBeNull()
    }))

  it('can be merged, moved, and split off again', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const first = await ticket(tx, place.id, { minutesAgo: 60 })
      const second = await ticket(tx, place.id, { status: 'CANCELLED', minutesAgo: 20 })
      const secondAdded = await ticket(tx, place.id, { parentId: second.id, minutesAgo: 10 })
      signInAs(waiter)
      expect(await mergeBills({ billId: second.id, intoId: first.id })).toMatchObject({ ok: true })
      expect(await unmergeBill({ billId: second.id })).toMatchObject({ ok: true })
      expect((await state(tx, secondAdded.id)).parentId).toBe(second.id)
      expect(await moveBill({ billId: second.id, table: '9' })).toMatchObject({ ok: true, table: '9' })
      expect((await state(tx, secondAdded.id)).table).toBe('9')
    }))
})

describe('undoing a merge after the bills moved on', () => {
  it('refuses once the surviving bill was merged into a third, and undoes that later merge whole', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const c = await ticket(tx, place.id, { minutesAgo: 90 })
      const a = await ticket(tx, place.id, { minutesAgo: 60 })
      const b = await ticket(tx, place.id, { minutesAgo: 30 })
      signInAs(waiter)
      await mergeBills({ billId: b.id, intoId: a.id })
      await mergeBills({ billId: a.id, intoId: c.id })

      expect(await unmergeBill({ billId: b.id })).toEqual({ ok: false, refused: 'not_merged' })
      // Undoing the later merge gives A back with what it brought, B included.
      expect(await unmergeBill({ billId: a.id })).toMatchObject({ ok: true })
      expect((await state(tx, b.id)).parentId).toBe(a.id)
      // A was merged away since B joined it: that undo is no longer "as it was".
      expect(await unmergeBill({ billId: b.id })).toEqual({ ok: false, refused: 'not_merged' })
    }))

  it('refuses once the surviving bill was moved to another table', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const a = await ticket(tx, place.id, { minutesAgo: 60 })
      const b = await ticket(tx, place.id, { minutesAgo: 30 })
      signInAs(waiter)
      await mergeBills({ billId: b.id, intoId: a.id })
      await moveBill({ billId: a.id, table: '9' })
      expect(await unmergeBill({ billId: b.id })).toEqual({ ok: false, refused: 'not_merged' })
      expect((await state(tx, b.id)).parentId).toBe(a.id)
    }))

  it('refuses a merge into an addition', () =>
    withRollback(async (tx) => {
      const { place, waiter } = await floor(tx)
      const bill = await ticket(tx, place.id, { minutesAgo: 60 })
      const added = await ticket(tx, place.id, { parentId: bill.id, minutesAgo: 40 })
      const other = await ticket(tx, place.id, { minutesAgo: 20 })
      signInAs(waiter)
      expect(await mergeBills({ billId: other.id, intoId: added.id })).toEqual({ ok: false, refused: 'not_a_parent' })
      expect((await state(tx, other.id)).parentId).toBeNull()
    }))
})

describe('the bill actions against the wrong caller', () => {
  it('read another restaurant’s bill as not found to its neighbour’s manager', () =>
    withRollback(async (tx) => {
      const { place } = await floor(tx)
      const bill = await ticket(tx, place.id, { status: 'DONE' })
      const other = await restaurant(tx)
      signInAs(await managerOf(tx, [other.id]))
      await expect(closeBill({ billId: bill.id })).rejects.toBeInstanceOf(AuthError)
      await expect(moveBill({ billId: bill.id, table: '9' })).rejects.toBeInstanceOf(AuthError)
      await expect(unmergeBill({ billId: bill.id })).rejects.toBeInstanceOf(AuthError)
      await expect(mergeBills({ billId: '8f0f3d6a-1d3f-4a1b-9c2e-000000000008', intoId: bill.id })).rejects.toBeInstanceOf(AuthError)
      expect(await state(tx, bill.id)).toMatchObject({ closedAt: null, table: '4' })
    }))

  it('refuse anybody not signed in with a 401, for a real id and a made-up one alike', () =>
    withRollback(async (tx) => {
      const { place } = await floor(tx)
      const bill = await ticket(tx, place.id)
      signInAs(null)
      for (const billId of [bill.id, '8f0f3d6a-1d3f-4a1b-9c2e-000000000009']) {
        await expect(closeBill({ billId })).rejects.toMatchObject({ status: 401 })
        await expect(moveBill({ billId, table: '9' })).rejects.toMatchObject({ status: 401 })
        await expect(unmergeBill({ billId })).rejects.toMatchObject({ status: 401 })
        await expect(mergeBills({ billId: '8f0f3d6a-1d3f-4a1b-9c2e-000000000008', intoId: billId })).rejects.toMatchObject({ status: 401 })
      }
    }))
})
