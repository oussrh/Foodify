import { describe, expect, it } from 'vitest'
import { staffViewport } from './staff-viewport'

describe('the staff viewport', () => {
  it('declares one light theme colour, not the device-keyed light/dark pair', () => {
    expect(staffViewport).toEqual({ themeColor: '#FAFAF8' })
  })
})
