import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The push service is stood in for (nothing leaves the machine); the subscriptions, the guards and
// the access check a send makes are the real database's. Push is switched on for this file only:
// everywhere else the suite runs without VAPID keys, which is push off.
const { sendNotification } = vi.hoisted(() => ({ sendNotification: vi.fn() }))
vi.mock('web-push', () => {
  class WebPushError extends Error {
    constructor(readonly statusCode: number) {
      super(`push service answered ${statusCode}`)
    }
  }
  return { sendNotification, WebPushError }
})
vi.mock('@/lib/env', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/env')>()
  const vapid = { publicKey: 'BPub', privateKey: 'priv', subject: 'mailto:ops@example.com' }
  return { ...real, serverEnv: { webPush: vapid } }
})

import { WebPushError } from 'web-push'
import { removePushSubscription, savePushSubscription } from '@/app/actions/push-actions'
import { sendPush } from '@/server/push'
import { withRollback, type Tx } from './db'
import { kitchenTablet, manager, restaurant, waiter } from './fixtures'
import { signInAs } from './session'

let n = 0
const endpoint = () => `https://fcm.googleapis.com/fcm/send/device-${++n}`
const keys = { p256dh: `B${'a'.repeat(86)}`, auth: 'c2VjcmV0LWF1dGgta2V5MQ' }
const subscribe = (restaurantId: string, app: 'board' | 'waiter', at = endpoint()) =>
  savePushSubscription({ restaurantId, app, subscription: { endpoint: at, keys } })
const rowsOf = (tx: Tx, restaurantId: string) =>
  tx.pushSubscription.findMany({ where: { restaurantId }, select: { endpoint: true, userId: true, app: true }, orderBy: { endpoint: 'asc' } })
const payload = { title: 'Table 4 is ready', body: 'Order #12 · 3 dishes', tag: 'ready-o1', url: '/waiter/K7M2QX', kind: 'ready' as const, restaurantId: 'r1' }
const sentTo = () => sendNotification.mock.calls.map(([subscription]) => (subscription as { endpoint: string }).endpoint).sort()

describe('saving a subscription', () => {
  it('stores a device of this restaurant against the person signed in on it', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const tablet = await kitchenTablet(tx, [mine.id])
      signInAs(tablet)
      const at = endpoint()
      expect(await subscribe(mine.id, 'board', at)).toEqual({ saved: true })
      expect(await rowsOf(tx, mine.id)).toEqual([{ endpoint: at, userId: tablet.id, app: 'board' }])
    }))

  it('refuses staff of another restaurant', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const theirs = await restaurant(tx)
      signInAs(await manager(tx, [theirs.id]))
      await expect(subscribe(mine.id, 'board')).rejects.toMatchObject({ status: 403 })
      signInAs(await waiter(tx, [theirs.id]))
      await expect(subscribe(mine.id, 'waiter')).rejects.toMatchObject({ status: 403 })
      expect(await rowsOf(tx, mine.id)).toEqual([])
    }))

  it('refuses a waiter on the kitchen board, and takes them on their own app', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await waiter(tx, [mine.id]))
      await expect(subscribe(mine.id, 'board')).rejects.toMatchObject({ status: 403 })
      expect(await subscribe(mine.id, 'waiter')).toEqual({ saved: true })
    }))

  it('refuses anybody signed out, and an endpoint that is not a push service', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      await expect(subscribe(mine.id, 'board')).rejects.toMatchObject({ status: 401 })
      signInAs(await manager(tx, [mine.id]))
      await expect(subscribe(mine.id, 'board', 'https://internal.example/admin')).rejects.toThrow()
      expect(await rowsOf(tx, mine.id)).toEqual([])
    }))

  it('moves a device that subscribes again to whoever is signed in now, for the restaurant and app they name', () =>
    withRollback(async (tx) => {
      const first = await restaurant(tx)
      const second = await restaurant(tx)
      const at = endpoint()
      signInAs(await kitchenTablet(tx, [first.id]))
      await subscribe(first.id, 'board', at)
      const next = await waiter(tx, [second.id])
      signInAs(next)
      await subscribe(second.id, 'waiter', at)
      expect(await rowsOf(tx, first.id)).toEqual([])
      expect(await rowsOf(tx, second.id)).toEqual([{ endpoint: at, userId: next.id, app: 'waiter' }])
    }))
})

describe('removing a subscription', () => {
  it('deletes the caller\'s own device, and leaves someone else\'s alone', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const mineAt = endpoint()
      const theirsAt = endpoint()
      signInAs(await waiter(tx, [mine.id]))
      await subscribe(mine.id, 'waiter', theirsAt)
      signInAs(await waiter(tx, [mine.id]))
      await subscribe(mine.id, 'waiter', mineAt)

      expect(await removePushSubscription({ endpoint: theirsAt })).toEqual({ removed: false })
      expect(await removePushSubscription({ endpoint: mineAt })).toEqual({ removed: true })
      expect((await rowsOf(tx, mine.id)).map((row) => row.endpoint)).toEqual([theirsAt])
    }))
})

describe('sending a push', () => {
  // A block, not an expression: a function returned from beforeEach is run as its cleanup, and
  // mockResolvedValue returns the mock itself.
  beforeEach(() => {
    sendNotification.mockResolvedValue({ statusCode: 201, body: '', headers: {} })
  })
  afterEach(() => vi.clearAllMocks())

  // A subscription as savePushSubscription would have stored it: restaurant, app, user.
  async function device(tx: Tx, [restaurantId, app, userId]: [string, 'board' | 'waiter', string]) {
    const at = endpoint()
    await tx.pushSubscription.create({ data: { endpoint: at, ...keys, app, userId, restaurantId } })
    return at
  }

  it('reaches this restaurant\'s devices on this app, and no other restaurant\'s or app\'s', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const theirs = await restaurant(tx)
      const floor = await waiter(tx, [mine.id])
      const pass = await kitchenTablet(tx, [mine.id])
      const elsewhere = await waiter(tx, [theirs.id])
      const wanted = await device(tx, [mine.id, 'waiter', floor.id])
      await device(tx, [mine.id, 'board', pass.id])
      await device(tx, [theirs.id, 'waiter', elsewhere.id])

      expect(await sendPush(mine.id, 'waiter', payload)).toEqual({ sent: 1 })
      expect(sentTo()).toEqual([wanted])
      const stamped = await tx.pushSubscription.findUniqueOrThrow({ where: { endpoint: wanted }, select: { lastUsedAt: true } })
      expect(stamped.lastUsedAt).toBeInstanceOf(Date)
    }))

  it('skips a person removed from the restaurant, though their device never unsubscribed', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const other = await restaurant(tx)
      const stays = await waiter(tx, [mine.id])
      const leaves = await waiter(tx, [mine.id, other.id])
      const kept = await device(tx, [mine.id, 'waiter', stays.id])
      await device(tx, [mine.id, 'waiter', leaves.id])
      await tx.user.update({ where: { id: leaves.id }, data: { restaurants: { disconnect: { id: mine.id } } } })

      await sendPush(mine.id, 'waiter', payload)
      expect(sentTo()).toEqual([kept])
    }))

  it('narrows to one person\'s devices when asked', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const took = await waiter(tx, [mine.id])
      const colleague = await waiter(tx, [mine.id])
      const phone = await device(tx, [mine.id, 'waiter', took.id])
      await device(tx, [mine.id, 'waiter', colleague.id])

      await sendPush(mine.id, 'waiter', payload, { userId: took.id })
      expect(sentTo()).toEqual([phone])
    }))

  it('deletes a device the push service says is gone, and keeps one it merely refused', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const floor = await waiter(tx, [mine.id])
      const gone = await device(tx, [mine.id, 'waiter', floor.id])
      const busy = await device(tx, [mine.id, 'waiter', floor.id])
      const refuse = (status: number) => new (WebPushError as unknown as new (status: number) => Error)(status)
      sendNotification.mockImplementation(async (subscription: { endpoint: string }) => {
        throw refuse(subscription.endpoint === gone ? 410 : 429)
      })

      expect(await sendPush(mine.id, 'waiter', payload)).toEqual({ sent: 0 })
      expect((await rowsOf(tx, mine.id)).map((row) => row.endpoint)).toEqual([busy])
    }))
})
