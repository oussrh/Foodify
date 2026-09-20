import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import DishPage from '@/components/menu/dish-page'
import { brandStyle } from '@/lib/brand-color'
import { serializeDish, serializeRestaurant, siteOrigin } from '@/lib/menu-data'

async function getDish(dishId: string, slug: string) {
  const dish = await prisma.dish.findUnique({
    where: { id: dishId },
    include: {
      ingredients: true,
      restaurant: true,
      subcategory: { include: { category: true } },
    },
  })
  if (!dish || !dish.isActive || dish.restaurant.slug !== slug) return null
  return dish
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; dishId: string }> }): Promise<Metadata> {
  const { slug, dishId } = await params
  const dish = await getDish(dishId, slug)
  if (!dish) return {}
  return {
    title: `${dish.nameEn} · ${dish.restaurant.name}`,
    description: dish.descriptionEn || undefined,
    openGraph: { images: [dish.imageUrl] },
  }
}

export default async function DishRoute({ params }: { params: Promise<{ slug: string; dishId: string }> }) {
  const { slug, dishId } = await params
  const dish = await getDish(dishId, slug)
  if (!dish) notFound()

  const restaurant = serializeRestaurant(dish.restaurant)
  const breadcrumb = dish.subcategory
    ? {
        en:
          dish.subcategory.nameEn.toLowerCase() === dish.subcategory.category.nameEn.toLowerCase()
            ? dish.subcategory.category.nameEn
            : `${dish.subcategory.category.nameEn} · ${dish.subcategory.nameEn}`,
        fr:
          dish.subcategory.nameFr.toLowerCase() === dish.subcategory.category.nameFr.toLowerCase()
            ? dish.subcategory.category.nameFr
            : `${dish.subcategory.category.nameFr} · ${dish.subcategory.nameFr}`,
      }
    : null

  return (
    <>
      {restaurant.googleFontUrl && <link href={restaurant.googleFontUrl} rel="stylesheet" />}
      <DishPage
        dish={serializeDish(dish)}
        restaurant={restaurant}
        breadcrumb={breadcrumb}
        brandStyle={brandStyle(restaurant.colorTheme)}
        shareUrl={`${siteOrigin()}/restaurant/${slug}/dish/${dish.id}`}
      />
    </>
  )
}
