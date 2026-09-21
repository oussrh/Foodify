import { describe, expect, it, vi } from 'vitest'
import { callArgs } from './mock-calls'

describe('callArgs', () => {
  it('reads the arguments of the n-th call', () => {
    const mock = vi.fn((a: number, b: string) => a + b.length)
    mock(1, 'one')
    mock(2, 'two')
    expect(callArgs(mock, 1)).toEqual([2, 'two'])
  })

  it('says which call never happened instead of failing on a TypeError', () => {
    const mock = vi.fn((a: number) => a)
    mock(1)
    expect(() => callArgs(mock, 3)).toThrow('call 3 never happened: the mock was called 1 time(s)')
  })
})
