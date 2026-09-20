import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Metadata, Viewport } from 'next'
import RestaurantPage from '@/components/menu/restaurant-page'
import { brandPalette, brandStyle } from '@/lib/brand-color'
import { parseSocialMedia } from '@/lib/social-media'
import { serializeDish, serializeRestaurant, siteOrigin } from '@/lib/menu-data'
import { restaurantJsonLd } from '@/lib/structured-data'
import type { MenuCategory } from '@/lib/menu'

async function getRestaurantData(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        include: {
          subcategories: {
            include: {
              dishes: {
                where: { isActive: true },
                include: { ingredients: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!restaurant) return null

  const uncategorizedDishes = await prisma.dish.findMany({
    where: { restaurantId: restaurant.id, subcategoryId: null, isActive: true },
    include: { ingredients: true },
    orderBy: { sortOrder: 'asc' },
  })

  return { restaurant, uncategorizedDishes }
}

type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<{ lang?: string; filter?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { name: true, tagline: true, coverImageUrl: true, logoUrl: true, city: true, cuisineType: true, defaultLocale: true },
  })
  if (!restaurant) return {}

  const origin = siteOrigin()
  const url = `${origin}/restaurant/${slug}`
  const description =
    restaurant.tagline || [restaurant.cuisineType, restaurant.city].filter(Boolean).join(' · ') || `Menu of ${restaurant.name}`
  const image = restaurant.coverImageUrl || restaurant.logoUrl || `${origin}/icons/icon-512.png`
  const appleIcon =
    restaurant.logoUrl && restaurant.logoUrl.includes('/image/upload/')
      ? restaurant.logoUrl.replace('/image/upload/', '/image/upload/w_180,h_180,c_lpad,b_white,f_png/')
      : '/icons/apple-touch-icon.png'

  return {
    title: `${restaurant.name} · Menu`,
    description,
    metadataBase: new URL(origin),
    alternates: { canonical: url, languages: { en: `${url}?lang=en`, fr: `${url}?lang=fr` } },
    manifest: `/restaurant/${slug}/manifest`,
    appleWebApp: { capable: true, title: restaurant.name, statusBarStyle: 'black-translucent' },
    icons: { apple: appleIcon },
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
export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { slug } = await params
  const restaurant = await prisma.restaurant.findUnique({ where: { slug }, select: { colorTheme: true, menuTheme: true } })
  const palette = brandPalette(restaurant?.colorTheme)
  if (restaurant?.menuTheme === 'dark') return { themeColor: '#141311', viewportFit: 'cover' }
  if (restaurant?.menuTheme === 'light') return { themeColor: palette.inkLight, viewportFit: 'cover' }
  return {
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: palette.inkLight },
      { media: '(prefers-color-scheme: dark)', color: '#141311' },
    ],
    viewportFit: 'cover',
  }
}

export default async function RestaurantRoute({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = searchParams ? await searchParams : undefined
  const data = await getRestaurantData(slug)
  if (!data) notFound()

  const { restaurant, uncategorizedDishes } = data
  const menuRestaurant = serializeRestaurant(restaurant)
  const categories: MenuCategory[] = restaurant.categories.map((cat) => ({
    id: cat.id,
    nameEn: cat.nameEn,
    nameFr: cat.nameFr,
    subcategories: cat.subcategories.map((sub) => ({
      id: sub.id,
      nameEn: sub.nameEn,
      nameFr: sub.nameFr,
      dishes: sub.dishes.map(serializeDish),
    })),
  }))
  const dishes = uncategorizedDishes.map(serializeDish)
  const origin = siteOrigin()
  const jsonLd = restaurantJsonLd(menuRestaurant, categories, dishes, origin)

  return (
    <>
      <link rel="preconnect" href="https://res.cloudinary.com" />
      {restaurant.googleFontUrl && (
        <>
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href={restaurant.googleFontUrl} rel="stylesheet" />
        </>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <RestaurantPage
        restaurant={menuRestaurant}
        categories={categories}
        uncategorizedDishes={dishes}
        social={parseSocialMedia(restaurant.socialMedia)}
        brandStyle={brandStyle(restaurant.colorTheme)}
        origin={origin}
        urlLang={sp?.lang ?? null}
        urlFilter={sp?.filter ?? null}
      />
    </>
  )
}
