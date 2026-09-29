import { describe, expect, it } from 'vitest'
import { themeStatus } from './theme-status'

describe('the theme status line', () => {
  it('says light when nothing is known yet: the staff default', () => {
    expect(themeStatus(undefined, undefined)).toBe('Light')
    expect(themeStatus('light', 'light')).toBe('Light')
  })

  it('says dark for a device that chose dark', () => {
    expect(themeStatus('dark', 'dark')).toBe('Dark')
  })

  it('says what "follow the device" comes to right now', () => {
    expect(themeStatus('system', 'dark')).toBe('Following the device: dark right now')
    expect(themeStatus('system', 'light')).toBe('Following the device: light right now')
    expect(themeStatus('system', undefined)).toBe('Following the device: light right now')
  })
})
