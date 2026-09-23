import { describe, expect, it } from 'vitest'
import { axisLabel, labelStride, niceTicks } from './insights-chart'

describe('niceTicks', () => {
  it('ends on a round number at or above the largest value', () => {
    expect(niceTicks(7)).toEqual([0, 2, 4, 6, 8])
    expect(niceTicks(95)).toEqual([0, 20, 40, 60, 80, 100])
    expect(niceTicks(1300)).toEqual([0, 500, 1000, 1500])
  })

  it('never steps by less than one: a count has no half', () => {
    expect(niceTicks(3)).toEqual([0, 1, 2, 3])
    expect(niceTicks(0.4)).toEqual([0, 1])
  })

  it('still draws an axis for an empty chart', () => {
    expect(niceTicks(0)).toEqual([0, 1])
    expect(niceTicks(Number.NaN)).toEqual([0, 1])
  })
})

describe('labelStride', () => {
  it('labels every column when they fit, and every n-th when they do not', () => {
    expect(labelStride(12, 12)).toBe(1)
    expect(labelStride(30, 6)).toBe(5)
    expect(labelStride(30, 0)).toBe(30)
  })
})

describe('axisLabel', () => {
  const start = new Date('2026-09-21T00:00:00Z')

  it('is short enough to sit under a column', () => {
    expect(axisLabel(start, 'day')).toBe('21 Sept')
    expect(axisLabel(start, 'week')).toBe('21 Sept')
    expect(axisLabel(new Date('2026-09-01T00:00:00Z'), 'month')).toBe('Sept')
    expect(axisLabel(new Date('2026-01-01T00:00:00Z'), 'year')).toBe('2026')
  })
})
