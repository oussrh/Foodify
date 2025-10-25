import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ImprovedDishDetail from '@/components/improved-dish-detail'
import { PublicThemeProvider } from '@/components/public-theme-provider'

async function getDishData(dishId: string, restaurantSlug: string) {
  const dish = await prisma.dish.findUnique({
    where: { id: dishId },
    include: {
      ingredients: true,
      subcategory: {
        include: {
          category: {
            include: {
              restaurant: true
            }
          }
        }
      },
      restaurant: true
    }
  })

  if (!dish || dish.restaurant?.slug !== restaurantSlug) {
    return null
  }

  return dish
}

export default async function DishPage({ 
  params 
}: { 
  params: Promise<{ slug: string; dishId: string }> 
}) {
  const { slug, dishId } = await params
  const dish = await getDishData(dishId, slug)
  
  if (!dish) {
    notFound()
  }

  if (!dish.restaurant) {
    notFound()
  }

  const restaurant = dish.restaurant

  // Serialize data for client components (convert Decimal to number)
  const serializedDish = {
    id: dish.id,
    nameEn: dish.nameEn,
    nameFr: dish.nameFr,
    descriptionEn: dish.descriptionEn,
    descriptionFr: dish.descriptionFr,
    imageUrl: dish.imageUrl,
    price: Number(dish.price),
    calories: dish.calories ? Number(dish.calories) : null,
    usdzUrl: dish.usdzUrl,
    glbUrl: dish.glbUrl,
    isMostPurchased: dish.isMostPurchased,
    ingredients: dish.ingredients
  }

  const serializedRestaurant = {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    defaultLocale: restaurant.defaultLocale,
    fontFamily: restaurant.fontFamily,
    colorTheme: restaurant.colorTheme,
    secondaryColor: restaurant.secondaryColor,
    currencySymbol: restaurant.currencySymbol,
    googleFontUrl: restaurant.googleFontUrl
  }

  const serializedSubcategory = dish.subcategory ? {
    nameEn: dish.subcategory.nameEn,
    nameFr: dish.subcategory.nameFr
  } : null

  return (
    <>
      {/* Load Google Font if specified */}
      {restaurant.googleFontUrl && (
        <link
          href={restaurant.googleFontUrl}
          rel="stylesheet"
        />
      )}

      <PublicThemeProvider>
        <ImprovedDishDetail
          dish={serializedDish}
          restaurant={serializedRestaurant}
          subcategory={serializedSubcategory}
        />
      </PublicThemeProvider>
    </>
  )
}