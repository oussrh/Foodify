import { describe, expect, it } from 'vitest'
import { brandPalette, brandStyle, contrast, hexToRgb } from './brand-color'

const PAPER: [number, number, number] = [250, 250, 248]
const COAL: [number, number, number] = [20, 19, 17]

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
  it('is symmetric and spans 1 to 21', () => {
    expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5)
    expect(contrast([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 5)
    expect(contrast([120, 120, 120], [120, 120, 120])).toBe(1)
  })
})

describe('brandPalette', () => {
  it('normalises the stored colour to #rrggbb', () => {
    expect(brandPalette('F0A').raw).toBe('#ff00aa')
  })

  it('falls back to the default colour when the stored value is not a hex colour', () => {
    expect(brandPalette('not a colour').raw).toBe('#1f6b49')
    expect(brandPalette(null, '#000000').raw).toBe('#000000')
  })

  it('derives inks that reach AA against both grounds, even from a pale neon', () => {
    const p = brandPalette('#ccff00')
    expect(contrast(hexToRgb(p.inkLight)!, PAPER)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(hexToRgb(p.inkDark)!, COAL)).toBeGreaterThanOrEqual(4.5)
  })

  it('leaves a colour that already reads AA on the light ground where it is', () => {
    const p = brandPalette('#1F6B49')
    expect(contrast(hexToRgb(p.inkLight)!, hexToRgb(p.raw)!)).toBeLessThan(1.05)
  })

  it('tints the raw colour at low alpha rather than painting it', () => {
    const p = brandPalette('#1F6B49')
    expect(p.tintLight).toBe('rgba(31, 107, 73, 0.14)')
    expect(p.tintDark).toBe('rgba(31, 107, 73, 0.16)')
  })

  it('picks white or near-black on top of each ink by contrast', () => {
    const dark = brandPalette('#000000')
    expect(dark.onLight).toBe('#ffffff')
    const light = brandPalette('#ffffff')
    expect(light.onDark).toBe('#141311')
  })
})

describe('brandStyle', () => {
  it('exposes the palette as the seven CSS variables globals.css maps', () => {
    expect(Object.keys(brandStyle('#1F6B49'))).toEqual([
      '--brand-raw',
      '--brand-ink-light',
      '--brand-ink-dark',
      '--brand-tint-light',
      '--brand-tint-dark',
      '--brand-on-light',
      '--brand-on-dark',
    ])
  })
})
