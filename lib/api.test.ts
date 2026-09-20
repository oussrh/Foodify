import { describe, expect, it } from 'vitest'
import { fail, ok } from './api'

describe('the response envelope', () => {
  it('wraps data, and meta only when there is some', async () => {
    await expect(ok([1]).json()).resolves.toEqual({ data: [1] })
    await expect(ok([1], { next: 'x' }).json()).resolves.toEqual({ data: [1], meta: { next: 'x' } })
    expect(ok(null, undefined, { status: 201 }).status).toBe(201)
  })

  it('names a failure by code and status, with details only when given', async () => {
    const r = fail('not_found', 'Dish not found', 404)
    expect(r.status).toBe(404)
    await expect(r.json()).resolves.toEqual({ error: 'Dish not found', code: 'not_found' })
    await expect(fail('invalid_payload', 'Bad', 400, { path: ['dishId'] }).json()).resolves.toEqual({ error: 'Bad', code: 'invalid_payload', details: { path: ['dishId'] } })
  })
})
