// FilePath: prisma/seed.js

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Hash the default password
    const hashedPassword = await bcrypt.hash("changeme", 10);

    // 1. Upsert the restaurant
    const restaurant = await prisma.restaurant.upsert({
      where: { slug: "foodify-test-kitchen" },
      update: {}, // add fields to update if desired
      create: {
        name: "Foodify Test Kitchen",
        slug: "foodify-test-kitchen",
        email: "contact@foodify.test",
        tagline: "AR dining reinvented",
        logoUrl: "/images/logo.png",
        colorTheme: "#ff0000",
        defaultLocale: "en",
      },
    });

    console.log('✅ Created/updated restaurant:', restaurant.name);

    // 2. Upsert the category
    let category = await prisma.menuCategory.findFirst({
      where: {
        restaurantId: restaurant.id,
        nameEn: "Starters",
      },
    });

    if (!category) {
      category = await prisma.menuCategory.create({
        data: {
          restaurantId: restaurant.id,
          nameEn: "Starters",
          nameFr: "Entrées",
          sortOrder: 1,
        },
      });
      console.log('✅ Created category:', category.nameEn);
    } else {
      console.log('ℹ️ Category already exists:', category.nameEn);
    }

    // 3. Upsert the subcategory
    let subcategory = await prisma.menuSubcategory.findFirst({
      where: {
        categoryId: category.id,
        nameEn: "Salads",
      },
    });

    if (!subcategory) {
      subcategory = await prisma.menuSubcategory.create({
        data: {
          categoryId: category.id,
          nameEn: "Salads",
          nameFr: "Salades",
          sortOrder: 1,
        },
      });
      console.log('✅ Created subcategory:', subcategory.nameEn);
    } else {
      console.log('ℹ️ Subcategory already exists:', subcategory.nameEn);
    }

    // 4. Upsert the dish
    let dish = await prisma.dish.findFirst({
      where: {
        restaurantId: restaurant.id,
        nameEn: "Grilled Chicken",
      },
    });

    if (!dish) {
      dish = await prisma.dish.create({
        data: {
          restaurantId: restaurant.id,
          subcategoryId: subcategory.id,
          nameEn: "Grilled Chicken",
          nameFr: "Poulet grillé",
          descriptionEn: "Juicy grilled chicken breast.",
          descriptionFr: "Poitrine de poulet grillée et juteuse.",
          price: 12.99,
          imageUrl: "/images/chicken.svg",
          usdzUrl: "/ar/chicken.usdz",
          glbUrl: "/ar/chicken.glb",
          isActive: true,
          isMostPurchased: false,
          sortOrder: 1,
        },
      });
      console.log('✅ Created dish:', dish.nameEn);
    } else {
      console.log('ℹ️ Dish already exists:', dish.nameEn);
    }

    // 5. Upsert the ingredient
    let ingredient = await prisma.ingredient.findFirst({
      where: {
        dishId: dish.id,
        nameEn: "Salt",
      },
    });

    if (!ingredient) {
      ingredient = await prisma.ingredient.create({
        data: {
          dishId: dish.id,
          nameEn: "Salt",
          nameFr: "Sel",
        },
      });
      console.log('✅ Created ingredient:', ingredient.nameEn);
    } else {
      console.log('ℹ️ Ingredient already exists:', ingredient.nameEn);
    }

    // 6. Upsert Super Admin
    await prisma.user.upsert({
      where: { email: "ousrh7@gmail.com" },
      update: {
        lastLogin: new Date(), // Update last login if user exists
      },
      create: {
        email: "ousrh7@gmail.com",
        passwordHash: hashedPassword,
        role: "SUPER_ADMIN",
        emailVerified: new Date(), // Add email verification
      },
    });
    console.log('✅ Created/updated Super Admin:', "ousrh7@gmail.com");

    // 7. Upsert Restaurant Admin
    const restaurantAdmin = await prisma.user.upsert({
      where: { email: "owner@foodify.test" },
      update: {
        lastLogin: new Date(),
      },
      create: {
        email: "owner@foodify.test",
        passwordHash: hashedPassword,
        role: "RESTAURANT_ADMIN",
        emailVerified: new Date(),
      },
    });

    // Connect restaurant to admin if not already connected
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        users: {
          connect: { id: restaurantAdmin.id }
        }
      }
    });

    console.log('✅ Created/updated Restaurant Admin:', "owner@foodify.test");

    console.log('🎉 Seed completed successfully!');
    console.log('📋 Summary:');
    console.log('   - Super Admin: ousrh7@gmail.com (password: changeme)');
    console.log('   - Restaurant Admin: owner@foodify.test (password: changeme)');
    console.log('   - Restaurant: Foodify Test Kitchen');
    console.log('   - Sample dish and categories created');

  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
