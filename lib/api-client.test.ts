import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, call, callAll } from './api-client'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('the browser side of the envelope', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('unwraps data and the next cursor', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ data: [1], meta: { next: 'c2' } })))
    await expect(call('/api/x')).resolves.toEqual({ data: [1], next: 'c2' })
  })

  it('throws the failure with its code and status, or unknown when the body is not the envelope', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ error: 'Forbidden', code: 'forbidden' }, 403)))
    await expect(call('/api/x')).rejects.toMatchObject({ name: 'ApiError', code: 'forbidden', status: 403 })
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>', { status: 502 })))
    await expect(call('/api/x')).rejects.toBeInstanceOf(ApiError)
  })

  it('follows next until the list is complete, keeping the query the url already has', async () => {
    const fetchMock = vi.fn(async (url: string) => (url.includes('cursor=') ? json({ data: [3], meta: { next: null } }) : json({ data: [1, 2], meta: { next: 'c' } })))
    vi.stubGlobal('fetch', fetchMock)
    await expect(callAll<number>('/api/users?role=RESTAURANT_ADMIN')).resolves.toEqual([1, 2, 3])
    expect(fetchMock.mock.calls[1][0]).toBe('/api/users?role=RESTAURANT_ADMIN&cursor=c')
  })
})
