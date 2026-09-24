import { describe, expect, it } from 'vitest'
import { sameSecret } from './secret'

describe('sameSecret', () => {
  it('is true for the same secret only', () => {
    expect(sameSecret('abc-123', 'abc-123')).toBe(true)
    expect(sameSecret('abc-124', 'abc-123')).toBe(false)
    expect(sameSecret('abc', 'abc-123')).toBe(false)
  })
})
