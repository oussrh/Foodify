import { describe, expect, it } from 'vitest'
import { afterResult, codeMessage, MAX_ATTEMPTS } from './job-rules'

describe('afterResult', () => {
  it('marks a job printed when the printer says so', () => {
    expect(afterResult(true, '', 1)).toBe('PRINTED')
  })

  it('waits without spending attempts while the printer needs a person', () => {
    expect(afterResult(false, 'EPTR_REC_EMPTY', MAX_ATTEMPTS + 3)).toBe('WAIT')
    expect(afterResult(false, 'EPTR_COVER_OPEN', 1)).toBe('WAIT')
  })

  it('retries any other failure until the attempts run out, then fails', () => {
    expect(afterResult(false, 'EX_TIMEOUT', MAX_ATTEMPTS - 1)).toBe('RETRY')
    expect(afterResult(false, 'EX_TIMEOUT', MAX_ATTEMPTS)).toBe('FAILED')
  })
})

describe('codeMessage', () => {
  it('says a known code in words and names an unknown one', () => {
    expect(codeMessage('EPTR_REC_EMPTY')).toBe('Out of paper')
    expect(codeMessage('EX_BADPORT')).toBe('Printer error EX_BADPORT')
    expect(codeMessage('')).toBe('Printer error')
  })
})
