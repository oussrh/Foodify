import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as placeOrder } from '@/app/api/orders/route'
import { GET as track } from '@/app/api/orders/track/[token]/route'
import { orderConfirmationText } from '@/lib/order-message'
import { sendSms } from '@/lib/sms'
import { pushNewOrder } from '@/server/order-push'
import { withRollback, type Tx } from './db'
import { dish, restaurant, waiter } from './fixtures'
import { signInAs } from './session'

// What leaves the route besides the guest's own answer, watched: the kitchen's push, the text of
// the confirmation and the SMS itself. The secret must reach none of them.
vi.mock('@/server/order-push', async (original) => {
  const actual = await original<typeof import('@/server/order-push')>()
  return { ...actual, pushNewOrder: vi.fn(async () => ({ sent: 0 })) }
})
vi.mock('@/lib/order-message', async (original) => {
  const actual = await original<typeof import('@/lib/order-message')>()
  return { ...actual, orderConfirmationText: vi.fn(actual.orderConfirmationText) }
})
vi.mock('@/lib/sms', () => ({ sendSms: vi.fn(async () => ({ sent: true })) }))
beforeEach(() => vi.clearAllMocks())

// A guest following their own order from their phone, against the real database: the secret the
// order is placed with, the hash that is all the row keeps of it, and the reading of the order
// that secret opens: what is still coming, and nothing the kitchen keeps to itself.

const post = (body: unknown) =>
  placeOrder(new NextRequest('http://test/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }))
const get = (token: string) => track(new Request(`http://test/api/orders/track/${token}`), { params: Promise.resolve({ token }) })
// An independent statement of the stored form, not the code's own helper.
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')

/** A restaurant taking orders, with two dishes at 9.50. */
async function floor(tx: Tx) {
  const mine = await restaurant(tx)
  await tx.restaurant.update({ where: { id: mine.id }, data: { orderingEnabled: true, currency: 'MAD' }, select: { id: true } })
  return { mine, tea: await dish(tx, mine.id, { nameEn: 'Tea' }), salad: await dish(tx, mine.id, { nameEn: 'Salad' }) }
}

/** A guest's order of three teas and a salad at table 7: the placed order, with its secret. */
async function guestOrder(tx: Tx) {
  const { mine, tea, salad } = await floor(tx)
  const res = await post({ restaurantId: mine.id, table: '7', phone: '+212600112233', note: 'Sans sel', lines: [{ dishId: tea.id, quantity: 3, note: 'Hot' }, { dishId: salad.id, quantity: 1 }] })
  expect(res.status).toBe(201)
  const { data } = (await res.json()) as { data: { id: string; number: number; token?: string } }
  if (!data.token) throw new Error('no tracking secret')
  return { mine, data, token: data.token }
}

describe('a guest order’s tracking secret', () => {
  it('is answered once and stored only as its SHA-256', () =>
    withRollback(async (tx) => {
      const { data, token } = await guestOrder(tx)
      expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/)
      const row = await tx.order.findUniqueOrThrow({ where: { id: data.id } })
      expect(row.guestTokenHash).toBe(sha256(token))
      // The secret itself is in no column of the row.
      expect(JSON.stringify(row)).not.toContain(token)
    }))

  it('reaches neither the kitchen’s push nor the guest’s text', () =>
    withRollback(async (tx) => {
      const { token } = await guestOrder(tx)
      // Each was called, so a silence here is not a pass by omission.
      expect(vi.mocked(pushNewOrder)).toHaveBeenCalledOnce()
      expect(vi.mocked(orderConfirmationText)).toHaveBeenCalledOnce()
      expect(vi.mocked(sendSms)).toHaveBeenCalledOnce()
      for (const calls of [vi.mocked(pushNewOrder).mock.calls, vi.mocked(orderConfirmationText).mock.calls, vi.mocked(sendSms).mock.calls]) {
        expect(JSON.stringify(calls)).not.toContain(token)
        expect(JSON.stringify(calls)).not.toContain('"token"')
      }
    }))

  it('is not made for an order a waiter takes at the table', () =>
    withRollback(async (tx) => {
      const { mine, tea } = await floor(tx)
      signInAs(await waiter(tx, [mine.id]))
      const res = await post({ restaurantId: mine.id, table: '2', lines: [{ dishId: tea.id, quantity: 1 }] })
      expect(res.status).toBe(201)
      const { data } = (await res.json()) as { data: { id: string; token?: string } }
      expect(data.token).toBeUndefined()
      expect((await tx.order.findUniqueOrThrow({ where: { id: data.id } })).guestTokenHash).toBeNull()
    }))
})

describe('GET /api/orders/track/<secret>', () => {
  it('answers the guest’s reading of the order, uncached, with nothing staff-only in it', () =>
    withRollback(async (tx) => {
      const { mine, data, token } = await guestOrder(tx)
      const res = await get(token)
      expect(res.status).toBe(200)
      expect(res.headers.get('Cache-Control')).toBe('no-store')
      const body = (await res.json()) as { data: Record<string, unknown> }
      expect(body.data).toMatchObject({ number: data.number, table: '7', status: 'NEW', subtotal: '38.00', currency: 'MAD', acceptedAt: null, restaurant: { slug: mine.slug } })
      const text = JSON.stringify(body)
      for (const secret of ['+212600112233', 'Sans sel', 'Hot', data.id, 'phone', 'placedBy', 'guestTokenHash']) expect(text, secret).not.toContain(secret)
    }))

  it('follows the kitchen, and lists only what is still coming', () =>
    withRollback(async (tx) => {
      const { data, token } = await guestOrder(tx)
      const accepted = new Date('2026-09-29T19:04:00Z')
      await tx.order.update({ where: { id: data.id }, data: { status: 'ACCEPTED', acceptedAt: accepted, subtotal: '19.00' } })
      // One tea taken off, the salad taken off whole.
      await tx.orderLine.updateMany({ where: { orderId: data.id, nameEn: 'Tea' }, data: { removedQuantity: 1 } })
      await tx.orderLine.updateMany({ where: { orderId: data.id, nameEn: 'Salad' }, data: { removedQuantity: 1 } })
      const { data: tracked } = (await (await get(token)).json()) as { data: { status: string; acceptedAt: string; subtotal: string; lines: unknown[] } }
      expect(tracked).toMatchObject({ status: 'ACCEPTED', acceptedAt: accepted.toISOString(), subtotal: '19.00' })
      expect(tracked.lines).toEqual([{ nameEn: 'Tea', nameFr: 'Tea', quantity: 2 }])
    }))

  it('shows the table the order was moved to', () =>
    withRollback(async (tx) => {
      const { data, token } = await guestOrder(tx)
      await tx.order.update({ where: { id: data.id }, data: { table: '12' } })
      expect(((await (await get(token)).json()) as { data: { table: string } }).data.table).toBe('12')
    }))

  it('says the order is closed once its own bill is, while the kitchen still has it', () =>
    withRollback(async (tx) => {
      const { data, token } = await guestOrder(tx)
      const closed = async () => ((await (await get(token)).json()) as { data: { closed: boolean; status: string } }).data
      expect(await closed()).toMatchObject({ closed: false, status: 'NEW' })
      await tx.order.update({ where: { id: data.id }, data: { status: 'ACCEPTED', closedAt: new Date() } })
      expect(await closed()).toMatchObject({ closed: true, status: 'ACCEPTED' })
    }))

  it('says the order is closed once the bill it was merged into is', () =>
    withRollback(async (tx) => {
      const first = await guestOrder(tx)
      const tea = await tx.dish.findFirstOrThrow({ where: { restaurantId: first.mine.id }, select: { id: true } })
      const res = await post({ restaurantId: first.mine.id, table: '7', phone: '+212600112244', lines: [{ dishId: tea.id, quantity: 1 }] })
      const into = ((await res.json()) as { data: { id: string } }).data
      await tx.order.update({ where: { id: first.data.id }, data: { parentId: into.id } })
      await tx.order.update({ where: { id: into.id }, data: { closedAt: new Date() } })
      expect(((await (await get(first.token)).json()) as { data: { closed: boolean } }).data.closed).toBe(true)
    }))

  it('answers a malformed secret and an unknown one alike, 404', () =>
    withRollback(async () => {
      const unknown = await get('A'.repeat(32))
      const malformed = await get('not-a-secret')
      expect([unknown.status, malformed.status]).toEqual([404, 404])
      expect(await unknown.json()).toEqual(await malformed.json())
    }))
})
