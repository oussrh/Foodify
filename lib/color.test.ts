import { describe, expect, it } from 'vitest'
import { contrast, hexToRgb, hslToRgb, rgbToHex } from './color'

describe('hexToRgb', () => {
  it('reads six-digit and three-digit hex, with or without the hash', () => {
    expect(hexToRgb('#1F6B49')).toEqual([31, 107, 73])
    expect(hexToRgb('fff')).toEqual([255, 255, 255])
  })

  it('returns null for anything that is not a hex colour', () => {
    expect(hexToRgb('#12345')).toBeNull()
    expect(hexToRgb('rgb(1,2,3)')).toBeNull()
    expect(hexToRgb('')).toBeNull()
  })
})

describe('contrast', () => {
  it('is the same whichever colour comes first', () => {
    expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(contrast([255, 255, 255], [0, 0, 0]), 10)
  })

  it('spans 1 for identical colours to 21 for black on white', () => {
    expect(contrast([120, 120, 120], [120, 120, 120])).toBe(1)
    expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5)
  })
})

describe('hslToRgb and rgbToHex', () => {
  it('round-trips a colour through HSL', () => {
    expect(rgbToHex(hslToRgb([153 / 360, 0.55, 0.27]))).toBe('#1f6b49')
  })

  it('treats zero saturation as grey', () => {
    expect(hslToRgb([0.3, 0, 0.5])).toEqual([127.5, 127.5, 127.5])
  })
})
