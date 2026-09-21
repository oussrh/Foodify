// test/mock-calls.ts
// The arguments a mock was called with, read by position. `mock.calls[n]` is `undefined` when
// the call never happened, and a test that then reads an argument fails on a TypeError instead
// of saying what did not happen; this throws with the count instead.
import type { Mock } from 'vitest'

/** The arguments of the mock's n-th call (0-based). */
export function callArgs<A extends unknown[]>(mock: Mock<(...args: A) => unknown>, n = 0): A {
  const call = mock.mock.calls[n]
  if (!call) throw new Error(`call ${n} never happened: the mock was called ${mock.mock.calls.length} time(s)`)
  return call
}
