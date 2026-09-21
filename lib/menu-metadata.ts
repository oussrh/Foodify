// lib/menu-metadata.ts
// The public menu route's <head>: what search engines, share sheets and the home-screen
// install read, and the browser chrome colour. Pure builders over the restaurant row.
import type { Metadata, Viewport } from 'next'
import type { Restaurant } from '@/generated/prisma/client'
import { brandPalette } from './brand-color'

type MetadataSource = Pick<Restaurant, 'name' | 'tagline' | 'coverImageUrl' | 'logoUrl' | 'city' | 'cuisineType' | 'defaultLocale'>

/** The dark ground of the menu (globals.css `.dark`), for the browser chrome when the menu is dark. */
const DARK_GROUND = '#141311'

/** A Cloudinary logo as a 180px padded PNG for the home-screen icon; the app's own icon otherwise. */
function appleIconOf(logoUrl: string | null): string {
  return logoUrl && logoUrl.includes('/image/upload/')
    ? logoUrl.replace('/image/upload/', '/image/upload/w_180,h_180,c_lpad,b_white,f_png/')
    : '/icons/apple-touch-icon.png'
}

/** Title, description, canonical and language alternates, manifest, icons, Open Graph and Twitter cards. */
export function menuMetadata(restaurant: MetadataSource, slug: string, origin: string): Metadata {
  const url = `${origin}/restaurant/${slug}`
  const description =
    restaurant.tagline || [restaurant.cuisineType, restaurant.city].filter(Boolean).join(' · ') || `Menu of ${restaurant.name}`
  const image = restaurant.coverImageUrl || restaurant.logoUrl || `${origin}/icons/icon-512.png`

  return {
    title: `${restaurant.name} · Menu`,
    description,
    metadataBase: new URL(origin),
    alternates: { canonical: url, languages: { en: `${url}?lang=en`, fr: `${url}?lang=fr` } },
    manifest: `/restaurant/${slug}/manifest`,
    appleWebApp: { capable: true, title: restaurant.name, statusBarStyle: 'black-translucent' },
    icons: { apple: appleIconOf(restaurant.logoUrl) },
    openGraph: {
      type: 'website',
      siteName: 'Foodify',
      title: restaurant.name,
      description,
      url,
      images: [{ url: image, alt: restaurant.name }],
      locale: restaurant.defaultLocale === 'fr' ? 'fr_FR' : 'en_GB',
    },
    twitter: { card: 'summary_large_image', title: restaurant.name, description, images: [image] },
    robots: { index: true, follow: true },
  }
}

/** Browser chrome takes the brand colour (or the dark ground when the menu is forced dark). */
export function menuViewport(restaurant: Pick<Restaurant, 'colorTheme' | 'menuTheme'> | null): Viewport {
  const palette = brandPalette(restaurant?.colorTheme)
  if (restaurant?.menuTheme === 'dark') return { themeColor: DARK_GROUND, viewportFit: 'cover' }
  if (restaurant?.menuTheme === 'light') return { themeColor: palette.inkLight, viewportFit: 'cover' }
  return {
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: palette.inkLight },
      { media: '(prefers-color-scheme: dark)', color: DARK_GROUND },
    ],
    viewportFit: 'cover',
  }
}
