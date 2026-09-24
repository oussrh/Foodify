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
vi.mock('@/lib/prisma', () => ({ default: { orderChange: { findUnique } } }))
vi.mock('@/server/push', () => ({ sendPush }))

import { pushChangeAnswer, pushChangeAnswers, pushChangeRequest } from './change-push'

const row = (over: Record<string, unknown> = {}) => ({
  id: 'c1',
  status: 'PENDING',
  quantity: 1,
  requestedById: 'w1',
  restaurantId: 'r1',
  restaurant: { code: 'K7M2QX' },
  order: { number: 12, table: '4' },
  line: { nameEn: 'Tea' },
  ...over,
})

describe('the floor’s requests and the kitchen’s answers', () => {
  beforeEach(() => {
    webPush.current = { publicKey: 'BPub', privateKey: 'priv', subject: 'mailto:ops@example.com' }
  })
  afterEach(() => vi.clearAllMocks())

  it('does not even read the change while push is off', async () => {
    webPush.current = null
    expect(await pushChangeRequest('c1')).toEqual({ sent: 0 })
    expect(await pushChangeAnswer('c1')).toEqual({ sent: 0 })
    expect(findUnique).not.toHaveBeenCalled()
  })

  it('sends nothing for a change that is gone', async () => {
    findUnique.mockResolvedValue(null)
    expect(await pushChangeRequest('c1')).toEqual({ sent: 0 })
    expect(await pushChangeAnswer('c1')).toEqual({ sent: 0 })
    expect(sendPush).not.toHaveBeenCalled()
  })

  it('wakes every kitchen board with the table and the dish', async () => {
    findUnique.mockResolvedValue(row())
    await pushChangeRequest('c1')
    expect(sendPush).toHaveBeenCalledWith('r1', 'board', expect.objectContaining({ title: 'Table 4 asks to remove 1 Tea', kind: 'request' }))
  })

  it('names a cancel by the order’s number', async () => {
    findUnique.mockResolvedValue(row({ line: null, quantity: null }))
    await pushChangeRequest('c1')
    expect(sendPush).toHaveBeenCalledWith('r1', 'board', expect.objectContaining({ title: 'Table 4 asks to cancel order #12' }))
  })

  it('answers only the phones of the waiter who asked', async () => {
    findUnique.mockResolvedValue(row({ status: 'APPLIED' }))
    await pushChangeAnswer('c1')
    expect(sendPush).toHaveBeenCalledWith('r1', 'waiter', expect.objectContaining({ title: 'Kitchen accepted: remove 1 Tea', kind: 'answer' }), { userId: 'w1' })
  })

  it('says a refusal as a refusal', async () => {
    findUnique.mockResolvedValue(row({ status: 'REFUSED' }))
    await pushChangeAnswer('c1')
    expect(sendPush).toHaveBeenCalledWith('r1', 'waiter', expect.objectContaining({ title: 'Kitchen refused: remove 1 Tea' }), { userId: 'w1' })
  })

  it('answers nobody while the request is still open, or when whoever asked is gone', async () => {
    findUnique.mockResolvedValue(row())
    expect(await pushChangeAnswer('c1')).toEqual({ sent: 0 })
    findUnique.mockResolvedValue(row({ status: 'APPLIED', requestedById: null }))
    expect(await pushChangeAnswer('c1')).toEqual({ sent: 0 })
    expect(sendPush).not.toHaveBeenCalled()
  })

  it('tells every waiter whose request a single change answered, and counts the devices', async () => {
    findUnique.mockResolvedValue(row({ status: 'REFUSED' }))
    expect(await pushChangeAnswers(['c1', 'c2'])).toEqual({ sent: 2 })
    expect(sendPush).toHaveBeenCalledTimes(2)
  })
})
