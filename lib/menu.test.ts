import { afterEach, describe, expect, it, vi } from 'vitest'
import { allergenLabel, dietaryLabel, formatPrice, hasAR, LOCALE_STORAGE_KEY, MENU_TEXT, offeredDietary, resolveInitialLocale, localName } from './menu'

describe('formatPrice', () => {
  it('formats with the ISO code through Intl, French style in French', () => {
    expect(formatPrice('12.50', { locale: 'fr', symbol: '€', code: 'EUR' })).toBe('12,50\u00A0€')
    expect(formatPrice('12.50', { locale: 'en', symbol: '€', code: 'EUR' })).toBe('€12.50')
  })

  it('falls back to the stored symbol when there is no usable code', () => {
    expect(formatPrice('80.00', { locale: 'en', symbol: 'DH', code: null })).toBe('DH80.00')
    expect(formatPrice('80.00', { locale: 'fr', symbol: 'DH', code: 'dirham' })).toBe('80,00 DH')
  })

  it('always shows two decimals', () => {
    expect(formatPrice('7.00', { locale: 'en', symbol: '$', code: null })).toBe('$7.00')
  })
})

describe('labels', () => {
  it('lists the offered dietary options in the vocabulary order and drops an unknown key', () => {
    expect(offeredDietary(['spicy', 'keto', 'vegetarian']).map((o) => o.key)).toEqual(['vegetarian', 'spicy'])
    expect(offeredDietary([])).toEqual([])
  })

  it('counts the matching dishes with the right plural in both languages', () => {
    expect(MENU_TEXT.en.results(1)).toBe('1 dish matches')
    expect(MENU_TEXT.en.results(3)).toBe('3 dishes match')
    expect(MENU_TEXT.fr.results(1)).toBe('1 plat correspond')
    expect(MENU_TEXT.fr.results(3)).toBe('3 plats correspondent')
  })

  it('names the menu after the restaurant in both languages', () => {
    expect(MENU_TEXT.en.menuOf('Chez Test')).toBe('Menu of Chez Test')
    expect(MENU_TEXT.fr.menuOf('Chez Test')).toBe('Menu de Chez Test')
  })

  it('translates a known dietary or allergen key', () => {
    expect(dietaryLabel('gluten_free', 'fr')).toBe('Sans gluten')
    expect(allergenLabel('nuts', 'en')).toBe('Nuts')
  })

  it('echoes an unknown key rather than hiding it', () => {
    expect(allergenLabel('pollen', 'en')).toBe('pollen')
    expect(dietaryLabel('keto', 'en')).toBe('keto')
  })

  it("picks a category name in the guest's language", () => {
    expect(localName('fr', 'Starters', 'Entrées')).toBe('Entrées')
    expect(localName('en', 'Starters', 'Entrées')).toBe('Starters')
  })
})

describe('hasAR', () => {
  it('is true with either AR asset', () => {
    expect(hasAR({ usdzUrl: 'a.usdz', glbUrl: null })).toBe(true)
    expect(hasAR({ usdzUrl: null, glbUrl: 'a.glb' })).toBe(true)
  })

  it('is false with no AR asset', () => {
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

  it('then the remembered choice over the browser language', () => {
    browser({ stored: 'fr', language: 'en-US' })
    expect(resolveInitialLocale('en')).toBe('fr')
  })

  it('then the browser language over the restaurant default', () => {
    browser({ language: 'fr-MA' })
    expect(resolveInitialLocale('en')).toBe('fr')
  })

  it('then the restaurant default when the browser speaks neither', () => {
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

  it("keeps the key under which guests' devices remember their language (renaming it orphans them)", () => {
    expect(LOCALE_STORAGE_KEY).toBe('foodify-menu-locale')
  })
})
