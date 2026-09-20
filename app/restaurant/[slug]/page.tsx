import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Metadata, Viewport } from 'next'
import RestaurantPage from '@/components/menu/restaurant-page'
import { brandStyle } from '@/lib/brand-color'
import { parseSocialMedia } from '@/lib/social-media'
import { serializeCategories, serializeDish, serializeRestaurant, siteOrigin } from '@/lib/menu-data'
import { loadMenu } from '@/lib/menu-loader'
import { menuMetadata, menuViewport } from '@/lib/menu-metadata'
import { restaurantJsonLd } from '@/lib/structured-data'

type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<{ lang?: string; filter?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { name: true, tagline: true, coverImageUrl: true, logoUrl: true, city: true, cuisineType: true, defaultLocale: true },
  })
  if (!restaurant) return {}
  return menuMetadata(restaurant, slug, siteOrigin())
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { slug } = await params
  const restaurant = await prisma.restaurant.findUnique({ where: { slug }, select: { colorTheme: true, menuTheme: true } })
  return menuViewport(restaurant)
}

export default async function RestaurantRoute({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = searchParams ? await searchParams : undefined
  const data = await loadMenu(slug)
  if (!data) notFound()

  const { restaurant, uncategorizedDishes } = data
  const menuRestaurant = serializeRestaurant(restaurant)
  const categories = serializeCategories(restaurant.categories)
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
