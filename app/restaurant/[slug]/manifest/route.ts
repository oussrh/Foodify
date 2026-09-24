import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { brandPalette } from '@/lib/brand-color'
import { slug as slugRule } from '@/lib/schemas/restaurant'

type Icon = { src: string; sizes: string; type: string; purpose: string }

/**
 * The three icons of the manifest, the 192px one first (the shortcuts reuse it). Cloudinary can
 * pad a logo into a square PNG on the fly; other hosts get the Foodify icons.
 */
function iconSet(logoUrl: string | null): [Icon, Icon, Icon] {
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

/**
 * GET, public: the web app manifest of one restaurant's menu, named and coloured for it, with
 * shortcuts to its AR dishes and to each language. A slug that is not one (`slug` in
 * lib/schemas/restaurant) or matches no restaurant is 404; answers with an hour's cache.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const parsed = slugRule.safeParse((await params).slug)
  if (!parsed.success) return new NextResponse('Not found', { status: 404 })
  const slug = parsed.data
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      name: true,
      tagline: true,
      logoUrl: true,
      colorTheme: true,
      menuTheme: true,
      defaultLocale: true,
      cuisineType: true,
      _count: { select: { dishes: { where: { isActive: true, OR: [{ usdzUrl: { not: '' } }, { glbUrl: { not: '' } }] } } } },
    },
  })
  if (!restaurant) return new NextResponse('Not found', { status: 404 })

  const palette = brandPalette(restaurant.colorTheme)
  const dark = restaurant.menuTheme === 'dark'
  const base = `/restaurant/${slug}`
  const icons = iconSet(restaurant.logoUrl)
  const shortcutIcon = [{ src: icons[0].src, sizes: '192x192', type: 'image/png' }]

  const shortcuts = [
    ...(restaurant._count.dishes > 0
      ? [{ name: 'AR dishes', short_name: 'AR', description: 'Dishes you can see on your table', url: `${base}?filter=ar&source=shortcut`, icons: shortcutIcon }]
      : []),
    { name: 'English', short_name: 'EN', url: `${base}?lang=en&source=shortcut`, icons: shortcutIcon },
    { name: 'Français', short_name: 'FR', url: `${base}?lang=fr&source=shortcut`, icons: shortcutIcon },
  ]

  const manifest = {
    id: base,
    name: restaurant.name,
    short_name: restaurant.name.length > 12 ? restaurant.name.slice(0, 12).trim() : restaurant.name,
    description: restaurant.tagline || [restaurant.cuisineType, `Menu of ${restaurant.name}`].filter(Boolean).join(' · '),
    start_url: `${base}?source=pwa`,
    scope: base,
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait',
    lang: restaurant.defaultLocale,
    dir: 'ltr',
    categories: ['food', 'lifestyle'],
    background_color: dark ? '#141311' : '#FAFAF8',
    theme_color: dark ? palette.inkDark : palette.inkLight,
    icons,
    shortcuts,
    // Tapping the icon focuses the menu that is already open instead of opening a second one.
    launch_handler: { client_mode: ['navigate-existing', 'auto'] },
    prefer_related_applications: false,
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
