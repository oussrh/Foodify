import { describe, expect, it } from 'vitest'
import { brandPalette, brandStyle } from './brand-color'
import { contrast, hexToRgb } from './color'

type RGB = [number, number, number]
const PAPER: RGB = [250, 250, 248]
const COAL: RGB = [20, 19, 17]

/** The palette only ever emits #rrggbb, so a null here is a broken palette, not a test input. */
function rgb(hex: string): RGB {
  const value = hexToRgb(hex)
  if (!value) throw new Error(`palette emitted a non-hex colour: ${hex}`)
  return value
}

describe('brandPalette', () => {
  it('normalises the stored colour to #rrggbb', () => {
    expect(brandPalette('F0A').raw).toBe('#ff00aa')
  })

  it('falls back to the default colour when the stored value is not a hex colour', () => {
    expect(brandPalette('not a colour').raw).toBe('#1f6b49')
    expect(brandPalette(null, '#000000').raw).toBe('#000000')
  })

  it('reports the stored inks against the bare grounds, as they are painted', () => {
    for (const hex of ['#3F6B8A', '#B8860B', '#F0A']) {
      const p = brandPalette(hex)
      expect(p.ratioLight).toBe(contrast(rgb(p.inkLight), PAPER))
      expect(p.ratioDark).toBe(contrast(rgb(p.inkDark), COAL))
    }
  })

  it('derives inks that reach AA on the tint they are written over, even from a pale neon', () => {
    const p = brandPalette('#3F6B8A')
    const over = (raw: string, ground: RGB, alpha: number) => rgb(raw).map((c, i) => Math.round(ground[i]! * (1 - alpha) + c * alpha)) as RGB
    expect(contrast(rgb(p.inkLight), over(p.raw, PAPER, 0.14))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(rgb(p.inkDark), over(p.raw, COAL, 0.16))).toBeGreaterThanOrEqual(4.5)
  })

  it('derives inks that reach AA against both grounds, even from a pale neon', () => {
    const p = brandPalette('#ccff00')
    expect(contrast(rgb(p.inkLight), PAPER)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(rgb(p.inkDark), COAL)).toBeGreaterThanOrEqual(4.5)
  })

  it('leaves a colour that already reads AA on the light ground where it is', () => {
    const p = brandPalette('#1F6B49')
    expect(contrast(rgb(p.inkLight), rgb(p.raw))).toBeLessThan(1.05)
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
