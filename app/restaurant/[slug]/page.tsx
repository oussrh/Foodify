import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Metadata, Viewport } from 'next'
import RestaurantPage from '@/components/menu/restaurant-page'
import { brandStyle } from '@/lib/brand-color'
import { parseSocialMedia } from '@/lib/social'
import { serializeCategories, serializeDish, serializeRestaurant, siteOrigin } from '@/lib/menu-data'
import { loadMenu } from '@/lib/menu-loader'
import { menuMetadata, menuViewport } from '@/lib/menu-metadata'
import { restaurantJsonLd } from '@/lib/structured-data'
import { menuQuery, menuSegment, routeParams, type SearchParams } from '@/lib/schemas/page-params'

type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<SearchParams> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = routeParams(menuSegment, await params)
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { name: true, tagline: true, coverImageUrl: true, logoUrl: true, city: true, cuisineType: true, defaultLocale: true },
  })
  if (!restaurant) return {}
  return menuMetadata(restaurant, slug, siteOrigin())
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const segment = menuSegment.safeParse(await params)
  const restaurant = segment.success ? await prisma.restaurant.findUnique({ where: { slug: segment.data.slug }, select: { colorTheme: true, menuTheme: true } }) : null
  return menuViewport(restaurant)
}

export default async function RestaurantRoute({ params, searchParams }: Props) {
  const { slug } = routeParams(menuSegment, await params)
  const query = menuQuery.parse((await searchParams) ?? {})
  const data = await loadMenu(slug)
  if (!data) notFound()

  const { restaurant, uncategorizedDishes } = data
  const menuRestaurant = serializeRestaurant(restaurant)
  const categories = serializeCategories(restaurant.categories, restaurant.dietaryOptions)
  const dishes = uncategorizedDishes.map((dish) => serializeDish(dish, restaurant.dietaryOptions))
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
        urlLang={query.lang ?? null}
        urlFilter={query.filter ?? null}
        urlTable={query.table ?? null}
      />
    </>
  )
}
