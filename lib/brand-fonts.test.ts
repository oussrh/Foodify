import { describe, expect, it } from 'vitest'
import { BRAND_FONTS, BRAND_FONTS_PREVIEW_URL } from './brand-fonts'

describe('BRAND_FONTS', () => {
  it('names each family once, in one of the three picker groups', () => {
    const families = BRAND_FONTS.map((f) => f.family)
    expect(new Set(families).size).toBe(families.length)
    for (const f of BRAND_FONTS) expect(['sans', 'serif', 'display']).toContain(f.category)
  })

  it('points every option at a Google Fonts css2 stylesheet for its own family, with swap display', () => {
    for (const f of BRAND_FONTS) {
      expect(f.url).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?family=/)
      expect(f.url).toContain(`family=${f.family.replace(/ /g, '+')}:`)
      expect(f.url).toMatch(/&display=swap$/)
    }
  })

  it('previews every option from one stylesheet', () => {
    expect(BRAND_FONTS_PREVIEW_URL).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?family=.*&display=swap$/)
    for (const f of BRAND_FONTS) expect(BRAND_FONTS_PREVIEW_URL).toContain(`family=${f.family.replace(/ /g, '+')}:`)
  })
})
