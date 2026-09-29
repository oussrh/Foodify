import { describe, expect, it, vi } from 'vitest'
import { LOCATION, TEST_CRON_SECRET, connection, outbox, place, posFloor } from './pos-fixtures'
import { mergeBills } from '@/app/actions/bill-actions'
import { choosePosLocation, connectPos } from '@/app/actions/pos-connect-actions'
import { disconnectPos } from '@/app/actions/pos-control-actions'
import { activatePos, savePosMapping } from '@/app/actions/pos-mapping-actions'
import { removeLine } from '@/app/actions/ticket-actions'
import { GET as cron } from '@/app/api/pos/outbox/route'
import { POST as webhook } from '@/app/api/pos/webhook/[provider]/route'
import { testPosSignature } from '@/lib/pos/test-adapter'
import { deliverDue } from '@/server/pos/deliver'
import { loadPosView } from '@/server/pos/view'
import { withRollback, type Tx } from './db'
import { first, ticket } from './bill-fixtures'
import { signInAs } from './session'

// What the Test POS tells us, through the real route and the real database: an event signed with
// the connection's key and a fresh timestamp is applied once (a second delivery is ignored, after a
// reconnect too), a paid check closes the bill as the POS once every ticket that reached the POS is
// paid, an item run out of sells its dishes out, a menu change waits for the owner; a bad signature
// or a stale one, another location's event, and anything unknown are refused. And the cron's route.

const pushChangeAnswers = vi.hoisted(() => vi.fn(async () => ({ sent: 0 })))
vi.mock('@/server/change-push', () => ({ pushChangeAnswers, pushChangeRequest: vi.fn(async () => ({ sent: 0 })) }))

const KEY = 'test_demo_key'
const now = () => String(Math.floor(Date.now() / 1000))

/** POSTs `event` to the connection's webhook, signed with `key` (the connection's own by default) at `timestamp` (now). */
function send(connectionId: string, event: Record<string, unknown>, { key = KEY, provider = 'test-pos', timestamp = now() } = {}) {
  const body = JSON.stringify(event)
  const headers = { 'x-test-pos-signature': testPosSignature(key, timestamp, body), 'x-test-pos-timestamp': timestamp }
  return webhook(new Request(`http://test/api/pos/webhook/${provider}?connection=${connectionId}`, { method: 'POST', headers, body }), { params: Promise.resolve({ provider }) })
}

/** A ticket as the POS took it: rung up on `check`. */
async function onCheck(tx: Tx, orderId: string, check: string) {
  await tx.order.update({ where: { id: orderId }, data: { externalId: `tpos-ticket-${orderId}`, posCheckId: check } })
}

describe('a check paid at the POS', () => {
  it('closes the bill as the POS, tells the waiters whose requests it answered, and does not send the close back', () =>
    withRollback(async (tx) => {
      const { place: restaurant, waiter } = await posFloor(tx)
      const made = await connection(tx, restaurant.id)
      const bill = await ticket(tx, restaurant.id, { status: 'ACCEPTED' })
      await onCheck(tx, bill.id, 'check-1')
      signInAs(waiter)
      const asked = await removeLine({ lineId: first(bill.lines).id, quantity: 1, reason: 'too_slow' })
      await tx.posOutbox.deleteMany()
      signInAs(null)
      pushChangeAnswers.mockClear()

      const res = await send(made.id, { id: 'ev-paid-1', type: 'PAID', location: LOCATION, bill: 'check-1' })
      expect(await res.json()).toEqual({ data: { duplicate: false, result: 'applied', kind: 'PAID' } })
      expect(await tx.order.findUniqueOrThrow({ where: { id: bill.id }, select: { closedById: true, closedAt: true, posPaidAt: true } })).toMatchObject({ closedById: null, closedAt: expect.any(Date), posPaidAt: expect.any(Date) })
      expect(await tx.orderChange.findFirstOrThrow({ where: { orderId: bill.id, kind: 'CLOSE' } })).toMatchObject({ source: 'POS', requestedById: null })
      expect(pushChangeAnswers).toHaveBeenCalledWith([asked.ok ? asked.changeId : ''])
      expect(await outbox(tx, restaurant.id)).toEqual([])
      expect(await tx.posInbox.findFirstOrThrow({ where: { connectionId: made.id } })).toMatchObject({ externalEventId: 'ev-paid-1', kind: 'PAID', appliedAt: expect.any(Date), payloadHash: expect.stringMatching(/^[0-9a-f]{64}$/) })
    }))

  it('after a merge, leaves the bill open until the check of every ticket that reached the POS is paid', () =>
    withRollback(async (tx) => {
      const { place: restaurant, waiter } = await posFloor(tx)
      const made = await connection(tx, restaurant.id)
      const a = await ticket(tx, restaurant.id, { status: 'DONE', minutesAgo: 30 })
      const b = await ticket(tx, restaurant.id, { status: 'DONE', minutesAgo: 20 })
      const never = await ticket(tx, restaurant.id, { status: 'DONE', parentId: a.id })
      await onCheck(tx, a.id, 'check-a')
      await onCheck(tx, b.id, 'check-b')
      signInAs(waiter)
      expect(await mergeBills({ billId: b.id, intoId: a.id })).toMatchObject({ ok: true })
      signInAs(null)

      expect(await (await send(made.id, { id: 'ev-a', type: 'PAID', location: LOCATION, bill: 'check-a' })).json()).toMatchObject({ data: { result: 'applied' } })
      expect((await tx.order.findUniqueOrThrow({ where: { id: a.id } })).closedAt).toBeNull()
      // The ticket that never reached the POS holds nothing up; the second check does.
      expect(await (await send(made.id, { id: 'ev-b', type: 'PAID', location: LOCATION, bill: 'check-b' })).json()).toMatchObject({ data: { result: 'applied' } })
      expect((await tx.order.findUniqueOrThrow({ where: { id: a.id } })).closedAt).toBeInstanceOf(Date)
      expect((await tx.order.findUniqueOrThrow({ where: { id: never.id } })).posPaidAt).toBeNull()
    }))
})

describe('the POS webhook', () => {
  it('ignores a second delivery of the same event', () =>
    withRollback(async (tx) => {
      const { place: restaurant } = await posFloor(tx)
      const made = await connection(tx, restaurant.id)
      const event = { id: 'ev-twice', type: 'CLOSED', location: LOCATION, bill: 'tpos-unknown' }
      expect(await (await send(made.id, event)).json()).toEqual({ data: { duplicate: false, result: 'ignored', kind: 'CLOSED' } })
      expect(await (await send(made.id, event)).json()).toEqual({ data: { duplicate: true } })
      expect(await tx.posInbox.count({ where: { connectionId: made.id } })).toBe(1)
    }))

  it('still recognises an event replayed after a disconnect and a reconnect', () =>
    withRollback(async (tx) => {
      const { place: restaurant, manager: owner } = await posFloor(tx)
      const made = await connection(tx, restaurant.id)
      const event = { id: 'ev-replayed', type: 'MENU_CHANGED', location: LOCATION }
      expect(await (await send(made.id, event)).json()).toMatchObject({ data: { result: 'recorded' } })
      signInAs(owner)
      await disconnectPos(restaurant.id)
      await connectPos(restaurant.id, { provider: 'test-pos', apiKey: KEY })
      await choosePosLocation(restaurant.id, { locationId: LOCATION })
      await activatePos(restaurant.id)
      expect(await (await send(made.id, event)).json()).toEqual({ data: { duplicate: true } })
    }))

  it('refuses a bad signature, and a good one on a stale timestamp, with 401 and keeps nothing', () =>
    withRollback(async (tx) => {
      const { place: restaurant } = await posFloor(tx)
      const made = await connection(tx, restaurant.id)
      const forged = await send(made.id, { id: 'ev-forged', type: 'PAID', location: LOCATION, bill: 'x' }, { key: 'test_someone_else' })
      expect(forged.status).toBe(401)
      expect(await forged.json()).toEqual({ error: 'The signature does not verify', code: 'unauthenticated' })
      const stale = String(Math.floor(Date.now() / 1000) - 6 * 60)
      expect((await send(made.id, { id: 'ev-old', type: 'PAID', location: LOCATION, bill: 'x' }, { timestamp: stale })).status).toBe(401)
      expect(await tx.posInbox.count()).toBe(0)
    }))

  it('answers the same 404 for anything it cannot verify: an unknown connection, another provider, unreadable credentials', () =>
    withRollback(async (tx) => {
      const { place: restaurant } = await posFloor(tx)
      const made = await connection(tx, restaurant.id)
      const event = { id: 'ev-1', type: 'PAID', location: LOCATION }
      const unknown = { error: 'Unknown webhook', code: 'not_found' }
      expect(await (await send('6f1c2b1e-8f7a-4c3e-9a1b-2d3e4f5a6b7c', event)).json()).toEqual(unknown)
      expect(await (await send(made.id, event, { provider: 'square' })).json()).toEqual(unknown)
      await tx.posConnection.update({ where: { id: made.id }, data: { credentials: 'v1.broken.value.x' } })
      expect(await (await send(made.id, event)).json()).toEqual(unknown)
      expect((await send('not-a-uuid', event)).status).toBe(400)
      expect(await tx.posInbox.count()).toBe(0)
    }))

  it('refuses another location’s verified event with 403', () =>
    withRollback(async (tx) => {
      const { place: restaurant } = await posFloor(tx)
      const made = await connection(tx, restaurant.id)
      expect((await send(made.id, { id: 'ev-far', type: 'PAID', location: 'tpos-terrace', bill: 'x' })).status).toBe(403)
    }))

  it('refuses a body over 64 KB unread', () =>
    withRollback(async (tx) => {
      const { place: restaurant } = await posFloor(tx)
      const made = await connection(tx, restaurant.id)
      expect((await send(made.id, { id: 'ev-big', type: 'MENU_CHANGED', location: LOCATION, padding: 'x'.repeat(70_000) })).status).toBe(413)
    }))

  it('answers a verified event 409 while the connection is paused, so the POS retries it later', () =>
    withRollback(async (tx) => {
      const { place: restaurant } = await posFloor(tx)
      const made = await connection(tx, restaurant.id, { status: 'PAUSED' })
      expect((await send(made.id, { id: 'ev-p', type: 'PAID', location: LOCATION, bill: 'x' })).status).toBe(409)
    }))

  it('sells out the dishes matched to an item the POS ran out of', () =>
    withRollback(async (tx) => {
      const { place: restaurant, harira } = await posFloor(tx)
      const made = await connection(tx, restaurant.id)
      await tx.posItemMap.create({ data: { connectionId: made.id, dishId: harira.id, externalItemId: 'tpos-item-harira', externalPrice: '4.50' } })
      expect(await (await send(made.id, { id: 'ev-out', type: 'ITEM_UNAVAILABLE', location: LOCATION, item: 'tpos-item-harira' })).json()).toMatchObject({ data: { result: 'applied' } })
      expect((await tx.dish.findUniqueOrThrow({ where: { id: harira.id } })).soldOutUntil?.getTime()).toBeGreaterThan(Date.now())
    }))

  it('records a menu change for the owner, applied only when the matches are saved', () =>
    withRollback(async (tx) => {
      const { place: restaurant, manager: owner, harira } = await posFloor(tx)
      const made = await connection(tx, restaurant.id)
      expect(await (await send(made.id, { id: 'ev-menu', type: 'MENU_CHANGED', location: LOCATION })).json()).toMatchObject({ data: { result: 'recorded' } })
      expect((await loadPosView(restaurant.id)).connection?.menuChanges).toBe(1)
      signInAs(owner)
      await savePosMapping(restaurant.id, { items: [{ dishId: harira.id, externalItemId: 'tpos-item-harira' }] })
      expect((await loadPosView(restaurant.id)).connection?.menuChanges).toBe(0)
    }))
})

describe('the outbox cron', () => {
  const call = (authorization?: string) => cron(new Request('http://test/api/pos/outbox', { headers: authorization ? { authorization } : {} }))

  it('refuses a call without the cron secret, or with another', () =>
    withRollback(async () => {
      expect((await call()).status).toBe(401)
      expect((await call('Bearer not-the-secret-at-all')).status).toBe(401)
    }))

  it('sends what is due for every restaurant when Vercel calls it, and answers the summary', () =>
    withRollback(async (tx) => {
      const { place: restaurant, harira } = await posFloor(tx)
      await connection(tx, restaurant.id)
      await place({ restaurantId: restaurant.id, table: '2', phone: '+212600112233', lines: [{ dishId: harira.id, quantity: 1 }] })
      const res = await call(`Bearer ${TEST_CRON_SECRET}`)
      expect(res.status).toBe(200)
      expect(await res.json()).toMatchObject({ data: { sent: 1, errors: 0 } })
      expect(await deliverDue()).toEqual({ sent: 0, retried: 0, failed: 0, refused: 0, errors: 0 })
    }))
})
