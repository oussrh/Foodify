import { describe, expect, it } from 'vitest'
import { moveTo } from './status'

describe('moveTo', () => {
  it('activates a matched connection, pauses an active one and resumes a paused one', () => {
    expect(moveTo('MAPPING', 'activate')).toBe('ACTIVE')
    expect(moveTo('ACTIVE', 'pause')).toBe('PAUSED')
    expect(moveTo('PAUSED', 'resume')).toBe('ACTIVE')
  })

  it('refuses a switch that does not apply where the connection is', () => {
    expect(moveTo('CONNECTING', 'activate')).toBeNull()
    expect(moveTo('ERROR', 'resume')).toBeNull()
    expect(moveTo('PAUSED', 'pause')).toBeNull()
    expect(moveTo('ACTIVE', 'activate')).toBeNull()
  })
})
