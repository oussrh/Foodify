import { beforeEach, describe, expect, it, vi } from 'vitest'

const deliverDue = vi.fn(async () => ({ sent: 0, retried: 0, failed: 0, refused: 0, errors: 0 }))
const findFirst = vi.fn(async (): Promise<{ id: string } | null> => ({ id: 'c-1' }))
const tasks: Promise<unknown>[] = []
const afterResponse = vi.fn((task: () => Promise<unknown>) => void tasks.push(task()))
vi.mock('@/server/pos/deliver', () => ({ deliverDue }))
vi.mock('@/server/after-response', () => ({ afterResponse }))
vi.mock('@/lib/prisma', () => ({ default: { posConnection: { findFirst } } }))

const { kickDelivery, sweepSoon, SWEEP_EVERY_MS } = await import('./trigger')

describe('the outbox triggers', () => {
  beforeEach(() => {
    deliverDue.mockClear()
    afterResponse.mockClear()
    findFirst.mockClear()
    tasks.length = 0
  })

  it('sweeps a restaurant after the response when something was queued', () => {
    kickDelivery('r-1')
    expect(afterResponse).toHaveBeenCalledTimes(1)
    expect(deliverDue).toHaveBeenCalledWith({ restaurantId: 'r-1' })
  })

  it('looks at a polled restaurant at most once per thirty seconds', async () => {
    expect(SWEEP_EVERY_MS).toBe(30_000)
    expect(sweepSoon('r-2', 1_000)).toBe(true)
    expect(sweepSoon('r-2', 30_999)).toBe(false)
    expect(sweepSoon('r-3', 30_999)).toBe(true)
    expect(sweepSoon('r-2', 31_000)).toBe(true)
    await Promise.all(tasks)
    expect(findFirst).toHaveBeenCalledTimes(3)
    expect(deliverDue).toHaveBeenCalledTimes(3)
  })

  it('does not sweep a polled restaurant without an active connection', async () => {
    findFirst.mockResolvedValueOnce(null)
    expect(sweepSoon('r-none', 1_000)).toBe(true)
    await Promise.all(tasks)
    expect(findFirst).toHaveBeenCalledWith({ where: { restaurantId: 'r-none', status: 'ACTIVE' }, select: { id: true } })
    expect(deliverDue).not.toHaveBeenCalled()
  })

  it('forgets every restaurant once it remembers a thousand, rather than grow', () => {
    for (let i = 0; i < 1000; i++) sweepSoon(`many-${i}`, 5_000_000)
    expect(sweepSoon('many-0', 5_000_001)).toBe(true)
  })
})
