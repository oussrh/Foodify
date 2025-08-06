import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Security check
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    if (process.env.NODE_ENV === 'production' && secret !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Setting up database...')

    // Execute raw SQL to create tables
    await prisma.$executeRaw`
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `

    await prisma.$executeRaw`
      -- Create enums
      DO $$ BEGIN
        CREATE TYPE "Locale" AS ENUM ('en', 'fr');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'RESTAURANT_ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "DeviceType" AS ENUM ('iOS', 'Android', 'Other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    // Create Restaurant table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Restaurant" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "email" TEXT,
        "phone" TEXT,
        "tagline" TEXT,
        "logoUrl" TEXT,
        "colorTheme" TEXT,
        "defaultLocale" "Locale" NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("id")
      );
    `

    // Create User table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "email" TEXT NOT NULL UNIQUE,
        "emailVerified" TIMESTAMP(3),
        "passwordHash" TEXT NOT NULL,
        "totpSecret" TEXT,
        "emailOtpCode" TEXT,
        "emailOtpExpires" TIMESTAMP(3),
        "role" "UserRole" NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastLogin" TIMESTAMP(3),
        "passwordResetToken" TEXT,
        "passwordResetExpires" TIMESTAMP(3),
        PRIMARY KEY ("id")
      );
    `

    // Create MenuCategory table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "MenuCategory" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "restaurantId" TEXT NOT NULL,
        "nameEn" TEXT NOT NULL,
        "nameFr" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL,
        PRIMARY KEY ("id")
      );
    `

    // Create MenuSubcategory table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "MenuSubcategory" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "categoryId" TEXT NOT NULL,
        "nameEn" TEXT NOT NULL,
        "nameFr" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL,
        PRIMARY KEY ("id")
      );
    `

    // Create Dish table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Dish" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "restaurantId" TEXT NOT NULL,
        "subcategoryId" TEXT,
        "nameEn" TEXT NOT NULL,
        "nameFr" TEXT NOT NULL,
        "descriptionEn" TEXT NOT NULL,
        "descriptionFr" TEXT NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "imageUrl" TEXT NOT NULL,
        "usdzUrl" TEXT NOT NULL,
        "glbUrl" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "calories" INTEGER,
        "isMostPurchased" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL,
        PRIMARY KEY ("id")
      );
    `

    // Create Ingredient table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Ingredient" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "dishId" TEXT NOT NULL,
        "nameEn" TEXT NOT NULL,
        "nameFr" TEXT NOT NULL,
        PRIMARY KEY ("id")
      );
    `

    // Create DishView table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "DishView" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "dishId" TEXT NOT NULL,
        "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deviceType" "DeviceType" NOT NULL,
        "arViewed" BOOLEAN NOT NULL,
        PRIMARY KEY ("id")
      );
    `

    // Create UserSessionLog table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "UserSessionLog" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "userId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "device" TEXT,
        "ipAddress" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("id")
      );
    `

    // Create junction table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "_RestaurantToUser" (
        "A" TEXT NOT NULL,
        "B" TEXT NOT NULL
      );
    `

    // Add foreign key constraints
    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_restaurantId_fkey" 
          FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "MenuSubcategory" ADD CONSTRAINT "MenuSubcategory_categoryId_fkey" 
          FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "Dish" ADD CONSTRAINT "Dish_restaurantId_fkey" 
          FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "Dish" ADD CONSTRAINT "Dish_subcategoryId_fkey" 
          FOREIGN KEY ("subcategoryId") REFERENCES "MenuSubcategory"("id") ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_dishId_fkey" 
          FOREIGN KEY ("dishId") REFERENCES "Dish"("id");
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "DishView" ADD CONSTRAINT "DishView_dishId_fkey"
          FOREIGN KEY ("dishId") REFERENCES "Dish"("id");
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "UserSessionLog" ADD CONSTRAINT "UserSessionLog_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "_RestaurantToUser" ADD CONSTRAINT "_RestaurantToUser_A_fkey"
          FOREIGN KEY ("A") REFERENCES "Restaurant"("id") ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "_RestaurantToUser" ADD CONSTRAINT "_RestaurantToUser_B_fkey" 
          FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    // Create indexes
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "_RestaurantToUser_AB_unique" ON "_RestaurantToUser"("A", "B");
    `

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "_RestaurantToUser_B_index" ON "_RestaurantToUser"("B");
    `

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully'
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to setup database', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}