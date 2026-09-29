import { describe, expect, it } from 'vitest'
import { guestStatus, isFinished, stepViews, type OrderStamps } from './guest-status'

const T0 = '2026-09-29T19:00:00.000Z'
const T1 = '2026-09-29T19:04:00.000Z'
const T2 = '2026-09-29T19:15:00.000Z'
const T3 = '2026-09-29T19:17:00.000Z'
const order = (overrides: Partial<OrderStamps>): OrderStamps => ({ status: 'NEW', createdAt: T0, acceptedAt: null, readyAt: null, servedAt: null, ...overrides })

describe('guestStatus', () => {
  // Stated literally, one status at a time, not read back from the module's own table.
  it('reads each kitchen status as the guest is told it', () => {
    expect(guestStatus('NEW')).toBe('sent')
    expect(guestStatus('ACCEPTED')).toBe('preparing')
    expect(guestStatus('READY')).toBe('ready')
    expect(guestStatus('DONE')).toBe('served')
    expect(guestStatus('CANCELLED')).toBe('cancelled')
  })
})

describe('isFinished', () => {
  it('is true once served or cancelled, and only then', () => {
    expect(isFinished('DONE')).toBe(true)
    expect(isFinished('CANCELLED')).toBe(true)
    expect(isFinished('NEW')).toBe(false)
    expect(isFinished('ACCEPTED')).toBe(false)
    expect(isFinished('READY')).toBe(false)
  })
})

describe('stepViews', () => {
  it('shows a new order at its first step, with the time it was sent', () => {
    expect(stepViews(order({}))).toEqual([
      { step: 'sent', reached: true, current: true, at: T0 },
      { step: 'preparing', reached: false, current: false, at: null },
      { step: 'ready', reached: false, current: false, at: null },
      { step: 'served', reached: false, current: false, at: null },
    ])
  })

  it('marks every step up to the current one reached, each with its own time', () => {
    const views = stepViews(order({ status: 'READY', acceptedAt: T1, readyAt: T2 }))
    expect(views?.map((v) => [v.step, v.reached, v.current, v.at])).toEqual([
      ['sent', true, false, T0],
      ['preparing', true, false, T1],
      ['ready', true, true, T2],
      ['served', false, false, null],
    ])
  })

  it('shows a served order complete', () => {
    const views = stepViews(order({ status: 'DONE', acceptedAt: T1, readyAt: T2, servedAt: T3 }))
    expect(views?.every((v) => v.reached)).toBe(true)
    expect(views?.at(-1)).toEqual({ step: 'served', reached: true, current: true, at: T3 })
  })

  it('counts a skipped step as passed without inventing a time for it', () => {
    const views = stepViews(order({ status: 'READY', readyAt: T2 }))
    expect(views?.[1]).toEqual({ step: 'preparing', reached: true, current: false, at: null })
  })

  it('never shows a stamp for a step not reached yet', () => {
    // A row can carry a stamp from before a status went back (a moved-back ticket): the step it
    // is not at yet shows no time.
    expect(stepViews(order({ status: 'NEW', acceptedAt: T1 }))?.[1]?.at).toBeNull()
  })

  it('has no progress to show for a cancelled order', () => {
    expect(stepViews(order({ status: 'CANCELLED', acceptedAt: T1 }))).toBeNull()
  })
})
