import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// web-push and the database are stood in for: this is the sending logic (who is asked for, what
// happens on each answer). tests/integration/push.test.ts runs the same query on a real Postgres.
const { webPush, findMany, updateMany, deleteMany, sendNotification, log } = vi.hoisted(() => ({
  webPush: { current: null as { publicKey: string; privateKey: string; subject: string } | null },
  findMany: vi.fn(),
  updateMany: vi.fn(async () => ({ count: 1 })),
  deleteMany: vi.fn(async () => ({ count: 1 })),
  sendNotification: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))
vi.mock('@/lib/env', () => ({
  serverEnv: {
    get webPush() {
      return webPush.current
    },
  },
}))
vi.mock('@/lib/prisma', () => ({ default: { pushSubscription: { findMany, updateMany, deleteMany } } }))
vi.mock('@/server/log', () => ({ log }))
vi.mock('web-push', () => {
  class WebPushError extends Error {
    constructor(readonly statusCode: number) {
      super(`push service answered ${statusCode}`)
    }
  }
  return { sendNotification, WebPushError }
})

import { WebPushError } from 'web-push'
import { sendPush } from './push'

const vapid = { publicKey: 'BPub', privateKey: 'priv', subject: 'mailto:ops@example.com' }
const payload = { title: 'New order #12', body: 'Table 4 · 3 dishes', tag: 'order-o1', url: '/kitchen/orders/K7M2QX', kind: 'order' as const, restaurantId: 'r1' }
const device = (id: string) => ({ id, endpoint: `https://fcm.googleapis.com/fcm/send/${id}`, p256dh: 'BKey', auth: 'auth' })
const refusal = (status: number) => new (WebPushError as unknown as new (status: number) => Error)(status)

describe('sendPush', () => {
  beforeEach(() => {
    webPush.current = vapid
    sendNotification.mockResolvedValue({ statusCode: 201, body: '', headers: {} })
  })
  afterEach(() => vi.clearAllMocks())

  it('sends nothing, reads nothing and says so once while the VAPID keys are not set', async () => {
    webPush.current = null
    expect(await sendPush('r1', 'board', payload)).toEqual({ sent: 0 })
    expect(await sendPush('r1', 'board', payload)).toEqual({ sent: 0 })
    expect(findMany).not.toHaveBeenCalled()
    expect(log.info).toHaveBeenCalledTimes(1)
  })

  it('asks only for this restaurant\'s devices on this app whose user still works there', async () => {
    findMany.mockResolvedValue([])
    await sendPush('r1', 'waiter', payload)
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { restaurantId: 'r1', app: 'waiter', user: { OR: [{ role: 'SUPER_ADMIN' }, { restaurants: { some: { id: 'r1' } } }] } },
      }),
    )
  })

  it('narrows to one person\'s devices when asked', async () => {
    findMany.mockResolvedValue([])
    await sendPush('r1', 'waiter', payload, { userId: 'u9' })
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: 'u9' }) }))
  })

  it('sends the payload as JSON, urgent and short-lived, and stamps each delivered device', async () => {
    findMany.mockResolvedValue([device('s1'), device('s2')])
    expect(await sendPush('r1', 'board', payload)).toEqual({ sent: 2 })
    expect(sendNotification).toHaveBeenCalledWith(
      { endpoint: 'https://fcm.googleapis.com/fcm/send/s1', keys: { p256dh: 'BKey', auth: 'auth' } },
      JSON.stringify(payload),
      expect.objectContaining({ vapidDetails: vapid, TTL: 600, urgency: 'high' }),
    )
    expect(updateMany).toHaveBeenCalledWith({ where: { id: 's1' }, data: { lastUsedAt: expect.any(Date) } })
  })

  it('holds a ready alert for less time than a new order', async () => {
    findMany.mockResolvedValue([device('s1')])
    await sendPush('r1', 'waiter', { ...payload, kind: 'ready' })
    expect(sendNotification).toHaveBeenCalledWith(expect.anything(), expect.any(String), expect.objectContaining({ TTL: 300 }))
  })

  it('deletes a subscription the push service says is gone, and delivers to the others', async () => {
    findMany.mockResolvedValue([device('gone'), device('lost'), device('ok')])
    sendNotification.mockRejectedValueOnce(refusal(410)).mockRejectedValueOnce(refusal(404))
    expect(await sendPush('r1', 'board', payload)).toEqual({ sent: 1 })
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: 'gone' } })
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: 'lost' } })
    expect(deleteMany).toHaveBeenCalledTimes(2)
  })

  it('keeps a subscription on any other refusal or a network failure, and logs its id and status only', async () => {
    findMany.mockResolvedValue([device('busy'), device('down')])
    sendNotification.mockRejectedValueOnce(refusal(429)).mockRejectedValueOnce(new Error('ECONNRESET'))
    expect(await sendPush('r1', 'board', payload)).toEqual({ sent: 0 })
    expect(deleteMany).not.toHaveBeenCalled()
    expect(log.warn).toHaveBeenCalledWith({ subscriptionId: 'busy', status: 429 }, expect.any(String))
    expect(log.warn).toHaveBeenCalledWith({ subscriptionId: 'down', status: null }, expect.any(String))
  })

  it('never throws: a failed read is logged and nothing is sent', async () => {
    findMany.mockRejectedValue(new Error('the database is down'))
    expect(await sendPush('r1', 'board', payload)).toEqual({ sent: 0 })
    expect(log.error).toHaveBeenCalledTimes(1)
  })
})
