import { describe, expect, it } from 'vitest'
import { restaurantRow } from '@/test/factories/prisma'
import { brandPalette } from './brand-color'
import { menuMetadata, menuViewport } from './menu-metadata'

const origin = 'https://foodify.app'
const cloudinaryLogo = 'https://res.cloudinary.com/x/image/upload/v1/logo.png'

describe('menuMetadata', () => {
  it('titles the page after the restaurant and points every alternate at its own URL', () => {
    const meta = menuMetadata(restaurantRow({ name: 'Chez Test' }), 'chez-test', origin)
    expect(meta.title).toBe('Chez Test · Menu')
    expect(meta.metadataBase).toEqual(new URL('https://foodify.app/'))
    expect(meta.alternates).toEqual({
      canonical: 'https://foodify.app/restaurant/chez-test',
      languages: { en: 'https://foodify.app/restaurant/chez-test?lang=en', fr: 'https://foodify.app/restaurant/chez-test?lang=fr' },
    })
    expect(meta.manifest).toBe('/restaurant/chez-test/manifest')
    expect(meta.robots).toEqual({ index: true, follow: true })
  })

  it('describes with the tagline, else cuisine and city, else the bare menu', () => {
    const describe_ = (over: Parameters<typeof restaurantRow>[0]) => menuMetadata(restaurantRow(over), 's', origin).description
    expect(describe_({ tagline: 'Slow food', cuisineType: 'Moroccan', city: 'Rabat' })).toBe('Slow food')
    expect(describe_({ tagline: null, cuisineType: 'Moroccan', city: 'Rabat' })).toBe('Moroccan · Rabat')
    expect(describe_({ tagline: '', cuisineType: null, city: 'Fes' })).toBe('Fes')
    expect(describe_({ tagline: null, cuisineType: null, city: null, name: 'Chez Test' })).toBe('Menu of Chez Test')
  })

  it('shares the cover, else the logo, else the app icon, on both card kinds', () => {
    const cover = menuMetadata(restaurantRow({ coverImageUrl: '/cover.jpg', logoUrl: '/logo.png', name: 'Chez Test' }), 's', origin)
    expect(cover.openGraph?.images).toEqual([{ url: '/cover.jpg', alt: 'Chez Test' }])
    expect(cover.twitter?.images).toEqual(['/cover.jpg'])
    expect(menuMetadata(restaurantRow({ coverImageUrl: null, logoUrl: '/logo.png' }), 's', origin).twitter?.images).toEqual(['/logo.png'])
    expect(menuMetadata(restaurantRow({ coverImageUrl: null, logoUrl: null }), 's', origin).twitter?.images).toEqual(['https://foodify.app/icons/icon-512.png'])
  })

  it('turns a Cloudinary logo into a padded 180px home-screen icon and keeps the app icon otherwise', () => {
    expect(menuMetadata(restaurantRow({ logoUrl: cloudinaryLogo }), 's', origin).icons).toEqual({
      apple: 'https://res.cloudinary.com/x/image/upload/w_180,h_180,c_lpad,b_white,f_png/v1/logo.png',
    })
    expect(menuMetadata(restaurantRow({ logoUrl: 'https://cdn.example/logo.png' }), 's', origin).icons).toEqual({ apple: '/icons/apple-touch-icon.png' })
    expect(menuMetadata(restaurantRow({ logoUrl: null }), 's', origin).icons).toEqual({ apple: '/icons/apple-touch-icon.png' })
  })

  it('marks the Open Graph locale from the default language', () => {
    expect(menuMetadata(restaurantRow({ defaultLocale: 'fr' }), 's', origin).openGraph).toMatchObject({ locale: 'fr_FR', siteName: 'Foodify', type: 'website' })
    expect(menuMetadata(restaurantRow({ defaultLocale: 'en' }), 's', origin).openGraph).toMatchObject({ locale: 'en_GB' })
  })
})

describe('menuViewport', () => {
  const ink = brandPalette('#2f6f4e').inkLight

  it('paints the chrome with the brand ink on a forced light menu and the dark ground on a forced dark one', () => {
    expect(menuViewport({ colorTheme: '#2f6f4e', menuTheme: 'light' })).toEqual({ themeColor: ink, viewportFit: 'cover' })
    expect(menuViewport({ colorTheme: '#2f6f4e', menuTheme: 'dark' })).toEqual({ themeColor: '#141311', viewportFit: 'cover' })
  })

  it('follows the system scheme otherwise, and falls back to the default palette without a restaurant', () => {
    expect(menuViewport({ colorTheme: '#2f6f4e', menuTheme: 'system' })).toEqual({
      themeColor: [
        { media: '(prefers-color-scheme: light)', color: ink },
        { media: '(prefers-color-scheme: dark)', color: '#141311' },
      ],
      viewportFit: 'cover',
    })
    expect(menuViewport(null)).toEqual({
      themeColor: [
        { media: '(prefers-color-scheme: light)', color: brandPalette(null).inkLight },
        { media: '(prefers-color-scheme: dark)', color: '#141311' },
      ],
      viewportFit: 'cover',
    })
  })
})
