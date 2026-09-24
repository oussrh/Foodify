import { describe, expect, it } from 'vitest'
import { answerOf, freshTimestamp } from './contract'

describe('answerOf', () => {
  it('hands back what the adapter answered, each of the three kinds', async () => {
    expect(await answerOf(async () => ({ kind: 'ok' as const, externalId: 'p-1' }))).toEqual({ kind: 'ok', externalId: 'p-1' })
    expect(await answerOf(async () => ({ kind: 'retry' as const, reason: 'Busy' }))).toEqual({ kind: 'retry', reason: 'Busy' })
    expect(await answerOf(async () => ({ kind: 'refused' as const, reason: 'No' }))).toEqual({ kind: 'refused', reason: 'No' })
  })

  it('reads a throw as "try again later", never as a refusal', async () => {
    expect(
      await answerOf(async () => {
        throw new Error('ECONNRESET')
      }),
    ).toEqual({ kind: 'retry', reason: 'The POS did not answer' })
  })

  it('reads a call that outlasts its limit as "too slow", a retry', async () => {
    expect(await answerOf(() => new Promise<{ kind: 'ok' }>(() => {}), 5)).toEqual({ kind: 'retry', reason: 'The POS did not answer in time' })
  })
})

describe('freshTimestamp', () => {
  const at = new Date('2026-09-25T10:00:00.000Z')
  const seconds = at.getTime() / 1000

  it('takes a timestamp within five minutes either way, and nothing further', () => {
    expect(freshTimestamp(String(seconds - 300), at)).toBe(true)
    expect(freshTimestamp(String(seconds + 300), at)).toBe(true)
    expect(freshTimestamp(String(seconds - 301), at)).toBe(false)
    expect(freshTimestamp(String(seconds + 301), at)).toBe(false)
  })

  it('refuses a timestamp that is missing or not whole seconds', () => {
    expect(freshTimestamp(undefined, at)).toBe(false)
    expect(freshTimestamp('1.5', at)).toBe(false)
    expect(freshTimestamp('', at)).toBe(false)
  })
})
