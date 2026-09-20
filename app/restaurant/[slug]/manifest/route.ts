import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { brandPalette } from '@/lib/brand-color'

/** Cloudinary can pad a logo into a square PNG on the fly; other hosts get the Foodify icons. */
function iconSet(logoUrl: string | null) {
  if (logoUrl && logoUrl.includes('/image/upload/')) {
    const t = (transform: string) => logoUrl.replace('/image/upload/', `/image/upload/${transform}/`)
    return [
      { src: t('w_192,h_192,c_lpad,b_white,f_png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: t('w_512,h_512,c_lpad,b_white,f_png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: t('w_360,h_360,c_lpad,b_white/w_512,h_512,c_lpad,b_white,f_png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ]
  }
  return [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ]
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { name: true, tagline: true, logoUrl: true, colorTheme: true, menuTheme: true, defaultLocale: true },
  })
  if (!restaurant) return new NextResponse('Not found', { status: 404 })

  const palette = brandPalette(restaurant.colorTheme)
  const dark = restaurant.menuTheme === 'dark'

  const manifest = {
    id: `/restaurant/${slug}`,
    name: restaurant.name,
    short_name: restaurant.name.length > 12 ? restaurant.name.slice(0, 12).trim() : restaurant.name,
    description: restaurant.tagline || `Menu of ${restaurant.name}`,
    start_url: `/restaurant/${slug}?source=pwa`,
    scope: `/restaurant/${slug}`,
    display: 'standalone',
    orientation: 'portrait',
    lang: restaurant.defaultLocale,
    background_color: dark ? '#141311' : '#FAFAF8',
    theme_color: dark ? palette.inkDark : palette.inkLight,
    icons: iconSet(restaurant.logoUrl),
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
