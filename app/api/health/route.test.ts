import { beforeEach, describe, expect, it, vi } from 'vitest'

const queryRaw = vi.fn<() => Promise<unknown>>()
const draining = vi.fn<() => boolean>()
vi.mock('@/lib/prisma', () => ({ default: { $queryRaw: queryRaw } }))
vi.mock('@/server/drain', () => ({ isDraining: draining }))

const { GET } = await import('./route')

describe('GET /api/health', () => {
  beforeEach(() => {
    queryRaw.mockReset().mockResolvedValue([{ '?column?': 1 }])
    draining.mockReset().mockReturnValue(false)
  })

  it('answers 200 with the database reached', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: { status: 'ok', database: 'ok' } })
    expect(queryRaw).toHaveBeenCalledTimes(1)
  })

  it('answers 503 unavailable when the database does not answer', async () => {
    queryRaw.mockRejectedValueOnce(new Error('connect ECONNREFUSED'))
    const res = await GET()
    expect(res.status).toBe(503)
    await expect(res.json()).resolves.toEqual({ error: 'Database unreachable', code: 'unavailable' })
  })

  it('answers 503 draining before asking the database once the process was told to stop', async () => {
    draining.mockReturnValue(true)
    const res = await GET()
    expect(res.status).toBe(503)
    await expect(res.json()).resolves.toEqual({ error: 'Shutting down', code: 'draining' })
    expect(queryRaw).not.toHaveBeenCalled()
  })
})
