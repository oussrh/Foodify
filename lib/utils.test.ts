import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('lets the last of two conflicting Tailwind classes win instead of keeping both', () => {
    expect(cn('p-2 text-sm', 'p-4')).toBe('text-sm p-4')
  })

  it('drops the conditionals that are false and keeps the rest in order', () => {
    expect(cn('a', false && 'b', undefined, { c: true, d: false }, ['e'])).toBe('a c e')
  })
})
