import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedDatabase(request: NextRequest) {
  try {
    // Security check - only allow in development or with a secret key
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    // For debugging
    console.log('Received secret:', secret)
    console.log('Expected secret:', process.env.NEXTAUTH_SECRET)
    console.log('NODE_ENV:', process.env.NODE_ENV)
    
    if (process.env.NODE_ENV === 'production' && secret !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: {
          receivedSecret: secret?.substring(0, 10) + '...',
          expectedExists: !!process.env.NEXTAUTH_SECRET,
          nodeEnv: process.env.NODE_ENV
        }
      }, { status: 401 })
    }

    // Hash the default password
    const hashedPassword = await bcrypt.hash('changeme', 10)

    // 1. Upsert the restaurant
    const restaurant = await prisma.restaurant.upsert({
      where: { slug: 'foodify-test-kitchen' },
      update: {},
      create: {
        name: 'Foodify Test Kitchen',
        slug: 'foodify-test-kitchen',
        email: 'contact@foodify.test',
        tagline: 'AR dining reinvented',
        logoUrl: '/images/logo.png',
        colorTheme: '#ff0000',
        defaultLocale: 'en',
      },
    })

    // 2. Upsert the category
    const category = await prisma.menuCategory.upsert({
      where: {
        id:
          (
            await prisma.menuCategory.findFirst({
              where: {
                restaurantId: restaurant.id,
                nameEn: 'Starters',
              },
            })
          )?.id || '',
      },
      update: {},
      create: {
        restaurantId: restaurant.id,
        nameEn: 'Starters',
        nameFr: 'Entrées',
        sortOrder: 1,
      },
    })

    // 3. Upsert the subcategory
    const subcategory = await prisma.menuSubcategory.upsert({
      where: {
        id:
          (
            await prisma.menuSubcategory.findFirst({
              where: {
                categoryId: category.id,
                nameEn: 'Salads',
              },
            })
          )?.id || '',
      },
      update: {},
      create: {
        categoryId: category.id,
        nameEn: 'Salads',
        nameFr: 'Salades',
        sortOrder: 1,
      },
    })

    // 4. Upsert the dish
    const dish = await prisma.dish.upsert({
      where: {
        id:
          (
            await prisma.dish.findFirst({
              where: {
                restaurantId: restaurant.id,
                nameEn: 'Grilled Chicken',
              },
            })
          )?.id || '',
      },
      update: {},
      create: {
        restaurantId: restaurant.id,
        subcategoryId: subcategory.id,
        nameEn: 'Grilled Chicken',
        nameFr: 'Poulet grillé',
        descriptionEn: 'Juicy grilled chicken breast.',
        descriptionFr: 'Poitrine de poulet grillée et juteuse.',
        price: 12.99,
        imageUrl: '/images/chicken.svg',
        usdzUrl: '/ar/chicken.usdz',
        glbUrl: '/ar/chicken.glb',
        isActive: true,
        isMostPurchased: false,
        sortOrder: 1,
      },
    })

    // 5. Upsert the ingredient
    await prisma.ingredient.upsert({
      where: {
        id:
          (
            await prisma.ingredient.findFirst({
              where: {
                dishId: dish.id,
                nameEn: 'Salt',
              },
            })
          )?.id || '',
      },
      update: {},
      create: {
        dishId: dish.id,
        nameEn: 'Salt',
        nameFr: 'Sel',
      },
    })

    // 6. Upsert Super Admin
    const superAdmin = await prisma.user.upsert({
      where: { email: 'ousrh7@gmail.com' },
      update: {},
      create: {
        email: 'ousrh7@gmail.com',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
      },
    })

    // 7. Upsert Restaurant Admin
    const restaurantAdmin = await prisma.user.upsert({
      where: { email: 'owner@foodify.test' },
      update: {},
      create: {
        email: 'owner@foodify.test',
        passwordHash: hashedPassword,
        role: 'RESTAURANT_ADMIN',
        restaurants: { connect: { id: restaurant.id } },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        restaurant: { id: restaurant.id, name: restaurant.name },
        superAdmin: { id: superAdmin.id, email: superAdmin.email, role: superAdmin.role },
        restaurantAdmin: { id: restaurantAdmin.id, email: restaurantAdmin.email, role: restaurantAdmin.role },
        category: { id: category.id, name: category.nameEn },
        subcategory: { id: subcategory.id, name: subcategory.nameEn },
        dish: { id: dish.id, name: dish.nameEn },
      }
    })

  } catch (error) {
    console.error('Seeding error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Support both GET and POST
export async function GET(request: NextRequest) {
  return seedDatabase(request)
}

export async function POST(request: NextRequest) {
  return seedDatabase(request)
}