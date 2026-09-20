// prisma/seed.ts: sample data for a fresh database. Run by `prisma db seed` through tsx (prisma.config.ts).

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { serverEnv } from "../lib/env";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: serverEnv.databaseUrl }) });

// 1. Upsert the restaurant
async function seedRestaurant() {
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
  return restaurant;
}

// 2. Upsert the category
async function seedCategory(restaurantId: string) {
  let category = await prisma.menuCategory.findFirst({
    where: {
      restaurantId,
      nameEn: "Starters",
    },
  });
  if (!category) {
    category = await prisma.menuCategory.create({
      data: {
        restaurantId,
        nameEn: "Starters",
        nameFr: "Entrées",
        sortOrder: 1,
      },
    });
    console.log('✅ Created category:', category.nameEn);
  } else {
    console.log('ℹ️ Category already exists:', category.nameEn);
  }
  return category;
}

// 3. Upsert the subcategory
async function seedSubcategory(categoryId: string) {
  let subcategory = await prisma.menuSubcategory.findFirst({
    where: {
      categoryId,
      nameEn: "Salads",
    },
  });
  if (!subcategory) {
    subcategory = await prisma.menuSubcategory.create({
      data: {
        categoryId,
        nameEn: "Salads",
        nameFr: "Salades",
        sortOrder: 1,
      },
    });
    console.log('✅ Created subcategory:', subcategory.nameEn);
  } else {
    console.log('ℹ️ Subcategory already exists:', subcategory.nameEn);
  }
  return subcategory;
}

// 4. Upsert the dish
async function seedDish(restaurantId: string, subcategoryId: string) {
  let dish = await prisma.dish.findFirst({
    where: {
      restaurantId,
      nameEn: "Grilled Chicken",
    },
  });
  if (!dish) {
    dish = await prisma.dish.create({
      data: {
        restaurantId,
        subcategoryId,
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
  return dish;
}

// 5. Upsert the ingredient
async function seedIngredient(dishId: string) {
  let ingredient = await prisma.ingredient.findFirst({
    where: {
      dishId,
      nameEn: "Salt",
    },
  });
  if (!ingredient) {
    ingredient = await prisma.ingredient.create({
      data: {
        dishId,
        nameEn: "Salt",
        nameFr: "Sel",
      },
    });
    console.log('✅ Created ingredient:', ingredient.nameEn);
  } else {
    console.log('ℹ️ Ingredient already exists:', ingredient.nameEn);
  }
  return ingredient;
}

// 6. Upsert Super Admin
async function seedSuperAdmin(hashedPassword: string) {
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
}

// 7. Upsert Restaurant Admin, connected to the restaurant if not already
async function seedRestaurantAdmin(hashedPassword: string, restaurantId: string) {
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
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      users: {
        connect: { id: restaurantAdmin.id }
      }
    }
  });
  console.log('✅ Created/updated Restaurant Admin:', "owner@foodify.test");
}

function printSummary() {
  console.log('🎉 Seed completed successfully!');
  console.log('📋 Summary:');
  console.log('   - Super Admin: ousrh7@gmail.com (password: changeme)');
  console.log('   - Restaurant Admin: owner@foodify.test (password: changeme)');
  console.log('   - Restaurant: Foodify Test Kitchen');
  console.log('   - Sample dish and categories created');
}

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Hash the default password
    const hashedPassword = await bcrypt.hash("changeme", 10);

    const restaurant = await seedRestaurant();
    const category = await seedCategory(restaurant.id);
    const subcategory = await seedSubcategory(category.id);
    const dish = await seedDish(restaurant.id, subcategory.id);
    await seedIngredient(dish.id);
    await seedSuperAdmin(hashedPassword);
    await seedRestaurantAdmin(hashedPassword, restaurant.id);
    printSummary();
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
