import { describe, expect, it } from 'vitest'
import { assignment, jsonBody } from './assignment'

describe('assignment schemas', () => {
  it('wants an array of UUIDs under the named field', () => {
    const s = assignment('userIds')
    expect(s.safeParse({ userIds: ['4f0c6b7e-3d2a-4c8e-9b1f-2a3b4c5d6e7f'] }).success).toBe(true)
    expect(s.safeParse({ userIds: ['1'] }).success).toBe(false)
    expect(s.safeParse({ restaurantIds: [] }).success).toBe(false)
  })

  it('reads a body that is not JSON as null', async () => {
    await expect(jsonBody(new Request('http://x', { method: 'POST', body: '{' }))).resolves.toBeNull()
    await expect(jsonBody(new Request('http://x', { method: 'POST', body: '{"a":1}' }))).resolves.toEqual({ a: 1 })
  })
})
