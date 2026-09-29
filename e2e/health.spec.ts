import { expect, test } from '@playwright/test'

// What a deploy reads before it routes traffic here: the production build answering with the
// database reached (the unit test mocks the client; this one does not).
test.describe('health', () => {
  test('answers 200 with the database reached and no cache header a balancer could trust twice', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ data: { status: 'ok', database: 'ok', build: expect.any(String) } })
    expect(res.headers()['cache-control'] ?? '').not.toMatch(/max-age=[1-9]|s-maxage=[1-9]/)
  })
})
