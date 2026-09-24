import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { webPush, findUnique, sendPush } = vi.hoisted(() => ({
  webPush: { current: null as object | null },
  findUnique: vi.fn(),
  sendPush: vi.fn(async () => ({ sent: 1 })),
}))
vi.mock('@/lib/env', () => ({
  serverEnv: {
    get webPush() {
      return webPush.current
    },
  },
}))
vi.mock('@/lib/prisma', () => ({ default: { order: { findUnique } } }))
vi.mock('@/server/push', () => ({ sendPush }))

import { pushNewOrder, pushOrderReady } from './order-push'

const restaurant = { id: 'r1', code: 'K7M2QX' }
const row = (placedBy: { id: string; role: string } | null) => ({
  id: 'o1',
  number: 12,
  table: '4',
  restaurantId: 'r1',
  restaurant: { code: 'K7M2QX' },
  placedBy,
  lines: [{ quantity: 2 }, { quantity: 1 }],
})

describe('pushNewOrder', () => {
  afterEach(() => vi.clearAllMocks())

  it('wakes every kitchen board of the restaurant, counting plates rather than lines', async () => {
    await pushNewOrder(restaurant, { id: 'o1', number: 12, table: '4', lines: [{ quantity: 2 }, { quantity: 1 }] })
    expect(sendPush).toHaveBeenCalledWith('r1', 'board', expect.objectContaining({ title: 'New order #12', body: 'Table 4 · 3 dishes', kind: 'order' }))
  })
})

describe('pushOrderReady', () => {
  beforeEach(() => {
    webPush.current = { publicKey: 'BPub', privateKey: 'priv', subject: 'mailto:ops@example.com' }
  })
  afterEach(() => vi.clearAllMocks())

  it('does not even read the order while push is off', async () => {
    webPush.current = null
    expect(await pushOrderReady('o1')).toEqual({ sent: 0 })
    expect(findUnique).not.toHaveBeenCalled()
  })

  it('buzzes only the waiter who took the order at the table', async () => {
    findUnique.mockResolvedValue(row({ id: 'w1', role: 'WAITER' }))
    await pushOrderReady('o1')
    expect(sendPush).toHaveBeenCalledWith('r1', 'waiter', expect.objectContaining({ title: 'Table 4 is ready', body: 'Order #12 · 3 dishes' }), { userId: 'w1' })
  })

  it('buzzes every waiter for a guest\'s order, or one a manager took', async () => {
    findUnique.mockResolvedValue(row(null))
    await pushOrderReady('o1')
    expect(sendPush).toHaveBeenLastCalledWith('r1', 'waiter', expect.anything())
    findUnique.mockResolvedValue(row({ id: 'm1', role: 'RESTAURANT_ADMIN' }))
    await pushOrderReady('o1')
    expect(sendPush).toHaveBeenLastCalledWith('r1', 'waiter', expect.anything())
  })

  it('falls back to every waiter when the one who took it has no phone to reach', async () => {
    findUnique.mockResolvedValue(row({ id: 'w1', role: 'WAITER' }))
    vi.mocked(sendPush).mockResolvedValueOnce({ sent: 0 })
    await pushOrderReady('o1')
    expect(sendPush).toHaveBeenCalledTimes(2)
    expect(sendPush).toHaveBeenLastCalledWith('r1', 'waiter', expect.anything())
  })

  it('sends nothing for an order that is no longer there', async () => {
    findUnique.mockResolvedValue(null)
    expect(await pushOrderReady('o1')).toEqual({ sent: 0 })
    expect(sendPush).not.toHaveBeenCalled()
  })
})
