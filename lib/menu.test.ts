import { afterEach, describe, expect, it, vi } from 'vitest'
import { allergenLabel, dietaryLabel, formatPrice, hasAR, LOCALE_STORAGE_KEY, resolveInitialLocale } from './menu'

describe('formatPrice', () => {
  it('formats with the ISO code through Intl, French style in French', () => {
    expect(formatPrice(12.5, { locale: 'fr', symbol: '€', code: 'EUR' })).toBe('12,50 €')
    expect(formatPrice(12.5, { locale: 'en', symbol: '€', code: 'EUR' })).toBe('€12.50')
  })

  it('falls back to the stored symbol when there is no usable code', () => {
    expect(formatPrice(80, { locale: 'en', symbol: 'DH', code: null })).toBe('DH80.00')
    expect(formatPrice(80, { locale: 'fr', symbol: 'DH', code: 'dirham' })).toBe('80,00 DH')
  })

  it('always shows two decimals', () => {
    expect(formatPrice(7, { locale: 'en', symbol: '$', code: null })).toBe('$7.00')
    expect(formatPrice(7.999, { locale: 'en', symbol: '$', code: null })).toBe('$8.00')
  })
})

describe('labels', () => {
  it('translates a known dietary or allergen key and echoes an unknown one', () => {
    expect(dietaryLabel('gluten_free', 'fr')).toBe('Sans gluten')
    expect(allergenLabel('nuts', 'en')).toBe('Nuts')
    expect(dietaryLabel('keto', 'en')).toBe('keto')
  })
})

describe('hasAR', () => {
  it('is true with either AR asset and false with none', () => {
    expect(hasAR({ usdzUrl: 'a.usdz', glbUrl: null })).toBe(true)
    expect(hasAR({ usdzUrl: null, glbUrl: 'a.glb' })).toBe(true)
    expect(hasAR({ usdzUrl: null, glbUrl: null })).toBe(false)
  })
})

describe('resolveInitialLocale', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const browser = (opts: { search?: string; stored?: string | null; language?: string; storageThrows?: boolean }) =>
    vi.stubGlobal('window', {
      location: { search: opts.search ?? '' },
      localStorage: {
        getItem: () => {
          if (opts.storageThrows) throw new Error('blocked')
          return opts.stored ?? null
        },
      },
      navigator: { language: opts.language ?? '' },
    })

  it('takes ?lang= from the server before anything else', () => {
    browser({ stored: 'en', language: 'en-GB' })
    expect(resolveInitialLocale('en', 'fr')).toBe('fr')
  })

  it('reads ?lang= from the window when the server saw none (offline-cached page)', () => {
    browser({ search: '?lang=fr', stored: 'en' })
    expect(resolveInitialLocale('en', null)).toBe('fr')
  })

  it('then the remembered choice, then the browser language, then the restaurant default', () => {
    browser({ stored: 'fr', language: 'en-US' })
    expect(resolveInitialLocale('en')).toBe('fr')
    browser({ language: 'fr-MA' })
    expect(resolveInitialLocale('en')).toBe('fr')
    browser({ language: 'ar-MA' })
    expect(resolveInitialLocale('fr')).toBe('fr')
  })

  it('survives a storage that throws', () => {
    browser({ storageThrows: true, language: 'en' })
    expect(resolveInitialLocale('fr')).toBe('en')
  })

  it('returns the default on the server, where there is no window', () => {
    expect(resolveInitialLocale('fr', 'de')).toBe('fr')
  })

  it('uses one storage key everywhere', () => {
    expect(LOCALE_STORAGE_KEY).toBe('foodify-menu-locale')
  })
})
