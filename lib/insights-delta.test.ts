import { describe, expect, it } from 'vitest'
import { percentDelta, pointsDelta } from './insights-delta'

describe('percentDelta', () => {
  it('says a rise and whether it is good for this figure', () => {
    expect(percentDelta(120, 100, 'up')).toEqual({ text: '+20%', direction: 'up', tone: 'good' })
    expect(percentDelta(120, 100, 'down')).toEqual({ text: '+20%', direction: 'up', tone: 'bad' })
  })

  it('writes a fall with a minus sign, not a hyphen', () => {
    expect(percentDelta(75, 100, 'down')).toEqual({ text: '−25%', direction: 'down', tone: 'good' })
  })

  it('reads a move that rounds to nothing as no change', () => {
    expect(percentDelta(1001, 1000, 'up')).toEqual({ text: 'No change', direction: 'flat', tone: 'neutral' })
  })

  it('has nothing to say against an earlier zero or a missing figure', () => {
    expect(percentDelta(5, 0, 'up')).toBeNull()
    expect(percentDelta(null, 300, 'down')).toBeNull()
    expect(percentDelta(300, null, 'down')).toBeNull()
  })
})

describe('pointsDelta', () => {
  it('moves a rate by points, not by a percentage of itself', () => {
    expect(pointsDelta(6, 4, 'up')).toEqual({ text: '+2 pts', direction: 'up', tone: 'good' })
    expect(pointsDelta(3, 5, 'down')).toEqual({ text: '−2 pts', direction: 'down', tone: 'good' })
  })

  it('compares from zero, which is a rate, but not from no rate', () => {
    expect(pointsDelta(4, 0, 'up')?.text).toBe('+4 pts')
    expect(pointsDelta(4, null, 'up')).toBeNull()
    expect(pointsDelta(null, 4, 'up')).toBeNull()
  })
})
