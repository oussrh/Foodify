import { describe, expect, it } from 'vitest'
import { deviceAnswer, fail, ok } from './api'

describe('the response envelope', () => {
  it('wraps data, and meta only when there is some', async () => {
    await expect(ok([1]).json()).resolves.toEqual({ data: [1] })
    await expect(ok([1], { meta: { next: 'x' } }).json()).resolves.toEqual({ data: [1], meta: { next: 'x' } })
    expect(ok(null, { status: 201 }).status).toBe(201)
  })

  it('names a failure by code and status, with details only when given', async () => {
    const r = fail('not_found', 'Dish not found', 404)
    expect(r.status).toBe(404)
    await expect(r.json()).resolves.toEqual({ error: 'Dish not found', code: 'not_found' })
    await expect(fail('invalid_payload', 'Bad', 400, { path: ['dishId'] }).json()).resolves.toEqual({ error: 'Bad', code: 'invalid_payload', details: { path: ['dishId'] } })
  })

  it('answers a device in its own protocol, uncached, with an empty body when there is nothing', async () => {
    const xml = deviceAnswer('<x/>', 'text/xml; charset=utf-8')
    expect(xml.status).toBe(200)
    expect(xml.headers.get('Content-Type')).toBe('text/xml; charset=utf-8')
    expect(xml.headers.get('Cache-Control')).toBe('no-store')
    await expect(xml.text()).resolves.toBe('<x/>')
    await expect(deviceAnswer(null, 'text/xml').text()).resolves.toBe('')
  })
})
