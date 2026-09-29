import { describe, expect, it } from 'vitest'
import { answerText, leaseUntil, nextStep } from './outbox-rules'

const t0 = new Date('2026-09-25T10:00:00.000Z')
const at = (minutes: number) => new Date(t0.getTime() + minutes * 60_000)

describe('nextStep', () => {
  it('settles a taken row as SENT with the POS id and the moment', () => {
    expect(nextStep({ kind: 'ok', externalId: 'x-1', note: 'Got it' }, 1, t0)).toEqual({ status: 'SENT', nextAttemptAt: null, lastAnswer: 'Got it', externalId: 'x-1', sentAt: t0 })
    expect(nextStep({ kind: 'ok' }, 3, t0)).toEqual({ status: 'SENT', nextAttemptAt: null, lastAnswer: 'Taken by the POS', externalId: null, sentAt: t0 })
  })

  it('settles a refusal as REFUSED at once, whatever the attempt', () => {
    expect(nextStep({ kind: 'refused', reason: 'Unknown item' }, 1, t0)).toEqual({ status: 'REFUSED', nextAttemptAt: null, lastAnswer: 'Unknown item', externalId: null, sentAt: null })
  })

  it('backs a retry off 1, 5, 15 then 60 minutes, and gives up on the fifth', () => {
    const retry = { kind: 'retry', reason: 'Busy' } as const
    expect(nextStep(retry, 1, t0).nextAttemptAt).toEqual(at(1))
    expect(nextStep(retry, 2, t0).nextAttemptAt).toEqual(at(5))
    expect(nextStep(retry, 3, t0).nextAttemptAt).toEqual(at(15))
    expect(nextStep(retry, 4, t0)).toEqual({ status: 'PENDING', nextAttemptAt: at(60), lastAnswer: 'Busy', externalId: null, sentAt: null })
    expect(nextStep(retry, 5, t0)).toEqual({ status: 'FAILED', nextAttemptAt: null, lastAnswer: 'Busy', externalId: null, sentAt: null })
  })
})

describe('answerText', () => {
  it('says the note, the reason, or that it was taken', () => {
    expect(answerText({ kind: 'ok', note: 'Ticket #4' })).toBe('Ticket #4')
    expect(answerText({ kind: 'ok' })).toBe('Taken by the POS')
    expect(answerText({ kind: 'retry', reason: 'Later' })).toBe('Later')
  })
})

describe('leaseUntil', () => {
  it('holds a claimed row for two minutes', () => {
    expect(leaseUntil(t0)).toEqual(at(2))
  })
})
