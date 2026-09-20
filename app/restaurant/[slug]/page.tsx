import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import RestaurantPage from '@/components/menu/restaurant-page'
import { brandStyle } from '@/lib/brand-color'
import { parseSocialMedia } from '@/lib/social-media'
import { serializeDish, serializeRestaurant, siteOrigin } from '@/lib/menu-data'
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const restaurant = await prisma.restaurant.findUnique({ where: { slug }, select: { name: true, tagline: true } })
  if (!restaurant) return {}
  return {
    title: `${restaurant.name} · Menu`,
    description: restaurant.tagline || `Menu of ${restaurant.name}`,
  }
}

export default async function RestaurantRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getRestaurantData(slug)
  if (!data) notFound()

  const { restaurant, uncategorizedDishes } = data

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

  return (
    <>
      {restaurant.googleFontUrl && <link href={restaurant.googleFontUrl} rel="stylesheet" />}
      <RestaurantPage
        restaurant={serializeRestaurant(restaurant)}
        categories={categories}
        uncategorizedDishes={uncategorizedDishes.map(serializeDish)}
        social={parseSocialMedia(restaurant.socialMedia)}
        brandStyle={brandStyle(restaurant.colorTheme)}
        origin={siteOrigin()}
      />
    </>
  )
}
