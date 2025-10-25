import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PublicThemeProvider } from '@/components/public-theme-provider'
import RestaurantPageClient from '@/components/restaurant-page-client'

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
                include: {
                  ingredients: true,
                  views: {
                    select: {
                      id: true,
                      arViewed: true
                    }
                  }
                },
                orderBy: { sortOrder: 'asc' }
              }
            },
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  if (!restaurant) {
    return null
  }

  // Get dishes that don't belong to any subcategory
  const uncategorizedDishes = await prisma.dish.findMany({
    where: {
      restaurantId: restaurant.id,
      subcategoryId: null,
      isActive: true
    },
    include: {
      ingredients: true,
      views: {
        select: {
          id: true,
          arViewed: true
        }
      }
    },
    orderBy: { sortOrder: 'asc' }
  })

  return { restaurant, uncategorizedDishes }
}

export default async function RestaurantPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  const data = await getRestaurantData(slug)
  
  if (!data) {
    notFound()
  }

  const { restaurant, uncategorizedDishes } = data
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://foodify.app'}/restaurant/${restaurant.slug}`

  // Helper function to serialize dish data (convert Decimal to number, Date to string)
  const serializeDish = (dish: any) => ({
    id: dish.id,
    restaurantId: dish.restaurantId,
    subcategoryId: dish.subcategoryId,
    nameEn: dish.nameEn,
    nameFr: dish.nameFr,
    descriptionEn: dish.descriptionEn,
    descriptionFr: dish.descriptionFr,
    price: Number(dish.price),
    imageUrl: dish.imageUrl,
    usdzUrl: dish.usdzUrl,
    glbUrl: dish.glbUrl,
    isActive: dish.isActive,
    calories: dish.calories ? Number(dish.calories) : null,
    isMostPurchased: dish.isMostPurchased,
    sortOrder: dish.sortOrder,
    createdAt: dish.createdAt?.toISOString() || null,
    ingredients: dish.ingredients || [],
    views: dish.views || []
  })

  // Serialize restaurant data for client components
  const serializedRestaurant = {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    email: restaurant.email,
    phone: restaurant.phone,
    tagline: restaurant.tagline,
    logoUrl: restaurant.logoUrl,
    colorTheme: restaurant.colorTheme,
    defaultLocale: restaurant.defaultLocale,
    streetAddress: restaurant.streetAddress,
    city: restaurant.city,
    state: restaurant.state,
    postalCode: restaurant.postalCode,
    country: restaurant.country,
    website: restaurant.website,
    openingHours: restaurant.openingHours,
    socialMedia: restaurant.socialMedia,
    coverImageUrl: restaurant.coverImageUrl,
    coverImageStyle: restaurant.coverImageStyle,
    secondaryColor: restaurant.secondaryColor,
    fontFamily: restaurant.fontFamily,
    googleFontUrl: restaurant.googleFontUrl,
    currencySymbol: restaurant.currencySymbol,
    categories: restaurant.categories.map((cat: any) => ({
      id: cat.id,
      nameEn: cat.nameEn,
      nameFr: cat.nameFr,
      sortOrder: cat.sortOrder,
      subcategories: cat.subcategories.map((sub: any) => ({
        id: sub.id,
        nameEn: sub.nameEn,
        nameFr: sub.nameFr,
        sortOrder: sub.sortOrder,
        dishes: sub.dishes.map(serializeDish)
      }))
    }))
  }

  const serializedUncategorizedDishes = uncategorizedDishes.map(serializeDish)

  const coverImageStyle = restaurant.coverImageUrl ? {
    backgroundImage: `url(${restaurant.coverImageUrl})`,
    backgroundSize: restaurant.coverImageStyle === 'repeat' ? 'auto' : 'cover',
    backgroundRepeat: restaurant.coverImageStyle === 'repeat' ? 'repeat' : 'no-repeat',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  } : {}

  const primaryColor = restaurant.colorTheme || '#6366f1'
  const secondaryColor = restaurant.secondaryColor || '#8b5cf6'
  const currency = restaurant.currencySymbol || '$'

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
        <RestaurantPageClient
          restaurant={serializedRestaurant}
          uncategorizedDishes={serializedUncategorizedDishes}
          currency={currency}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          coverImageStyle={coverImageStyle}
        />
      </PublicThemeProvider>
    </>
  )
}
