import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api-client'
import type { TrackedOrder } from '@/lib/schemas/order-tracking'
import { POLL_START, applyAnswer, failureOf, isOver, shouldPoll, type PollAnswer, type PollState } from './tracking-poll'

const order = (over: Partial<TrackedOrder> = {}): TrackedOrder => ({
  number: 12,
  table: '4',
  status: 'NEW',
  lines: [{ nameEn: 'Tea', nameFr: 'Thé', quantity: 1 }],
  subtotal: '9.50',
  currency: null,
  createdAt: '2026-09-29T19:00:00.000Z',
  acceptedAt: null,
  readyAt: null,
  servedAt: null,
  closed: false,
  restaurant: { slug: 'dar-zitoun', name: 'Dar Zitoun' },
  ...over,
})
const heard = (seq: number, over: Partial<TrackedOrder> = {}): PollAnswer => ({ seq, kind: 'order', order: order(over) })
/** The state after each answer in turn. */
const after = (...answers: PollAnswer[]): PollState => answers.reduce((state, answer) => applyAnswer(state, answer).state, POLL_START)

describe('shouldPoll', () => {
  it('asks while visible, idle and not done', () => {
    expect(shouldPoll(POLL_START, true, false)).toBe(true)
  })

  it('skips while the page is hidden', () => {
    expect(shouldPoll(POLL_START, false, false)).toBe(false)
  })

  it('never sends a second request while one is in flight', () => {
    expect(shouldPoll(POLL_START, true, true)).toBe(false)
  })

  it('stops for good once done', () => {
    expect(shouldPoll({ ...POLL_START, done: true }, true, false)).toBe(false)
  })
})

describe('isOver', () => {
  it('is true once served, cancelled or the bill closed', () => {
    expect(isOver({ status: 'DONE', closed: false })).toBe(true)
    expect(isOver({ status: 'CANCELLED', closed: false })).toBe(true)
    expect(isOver({ status: 'ACCEPTED', closed: true })).toBe(true)
    expect(isOver({ status: 'READY', closed: false })).toBe(false)
  })
})

describe('failureOf', () => {
  it('reads only the endpoint’s own 404 as an unknown secret', () => {
    expect(failureOf(new ApiError('not_found', 'Unknown order', 404))).toBe('not_found')
  })

  it('reads any other 404, a server error or no network as a failure to retry', () => {
    // A page from another deploy asking a route that moved gets Next's own 404, not ours.
    expect(failureOf(new ApiError('unknown', 'HTTP 404', 404))).toBe('failed')
    expect(failureOf(new ApiError('internal', 'Internal error', 500))).toBe('failed')
    expect(failureOf(new TypeError('Failed to fetch'))).toBe('failed')
  })
})

describe('applyAnswer', () => {
  it('shows an answer and hands it on to be recorded', () => {
    const effects = applyAnswer(POLL_START, heard(1, { status: 'ACCEPTED' }))
    expect(effects.state).toMatchObject({ seq: 1, online: true, done: false })
    expect(effects.heard?.status).toBe('ACCEPTED')
  })

  it('stops on served, on cancelled, and on a closed bill', () => {
    expect(after(heard(1, { status: 'DONE' })).done).toBe(true)
    expect(after(heard(1, { status: 'CANCELLED' })).done).toBe(true)
    expect(after(heard(1, { status: 'READY', closed: true })).done).toBe(true)
  })

  it('keeps the last answer on screen when a request fails, and says it is offline', () => {
    const state = after(heard(1, { status: 'ACCEPTED' }), { seq: 2, kind: 'failed' })
    expect(state.online).toBe(false)
    expect(state.order?.status).toBe('ACCEPTED')
    expect(state.done).toBe(false)
    expect(after(heard(1), { seq: 2, kind: 'failed' }, heard(3)).online).toBe(true)
  })

  it('forgets the secret only when the server says it is unknown, and stops', () => {
    const effects = applyAnswer(POLL_START, { seq: 1, kind: 'not_found' })
    expect(effects.forget).toBe(true)
    expect(effects.state).toMatchObject({ gone: true, done: true })
    expect(applyAnswer(POLL_START, { seq: 1, kind: 'failed' }).forget).toBe(false)
  })

  it('keeps the last good answer on a body it cannot read, without claiming to be offline, and stops', () => {
    const state = after(heard(1, { status: 'ACCEPTED' }), { seq: 2, kind: 'unreadable' })
    expect(state).toMatchObject({ online: true, outdated: true, done: true })
    expect(state.order?.status).toBe('ACCEPTED')
  })

  it('drops an answer older than the one already applied', () => {
    const state = after(heard(2, { status: 'READY' }), heard(1, { status: 'NEW' }))
    expect(state.order?.status).toBe('READY')
    expect(state.seq).toBe(2)
  })

  it('never lets a late answer reopen an order that is done', () => {
    const state = after(heard(2, { status: 'DONE' }), heard(3, { status: 'READY' }))
    expect(state).toMatchObject({ done: true, order: { status: 'DONE' } })
    expect(applyAnswer({ ...POLL_START, done: true, seq: 2 }, heard(3)).heard).toBeNull()
  })

  it('buzzes once, when this page sees the order go to ready', () => {
    const first = applyAnswer(POLL_START, heard(1, { status: 'ACCEPTED' }))
    const up = applyAnswer(first.state, heard(2, { status: 'READY' }))
    expect(up.buzz).toBe(true)
    expect(applyAnswer(up.state, heard(3, { status: 'READY' })).buzz).toBe(false)
    // Back in the kitchen and up again: still only the one buzz.
    const back = applyAnswer(up.state, heard(3, { status: 'ACCEPTED' }))
    expect(applyAnswer(back.state, heard(4, { status: 'READY' })).buzz).toBe(false)
  })

  it('does not buzz when the page opens on an order already up', () => {
    expect(applyAnswer(POLL_START, heard(1, { status: 'READY' })).buzz).toBe(false)
  })
})
