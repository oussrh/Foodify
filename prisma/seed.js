import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
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
      defaultLocale: "en",
    },
  });

  // 2. Upsert the category
  const category = await prisma.menuCategory.upsert({
    where: {
      // composite unique workaround: no composite unique constraint exists,
      // so we find the first matching manually:
      id:
        (
          await prisma.menuCategory.findFirst({
            where: {
              restaurantId: restaurant.id,
              nameEn: "Starters",
            },
          })
        )?.id || "",
    },
    update: {},
    create: {
      restaurantId: restaurant.id,
      nameEn: "Starters",
      nameFr: "Entrées",
      sortOrder: 1,
    },
  });

  // 3. Upsert the subcategory
  const subcategory = await prisma.menuSubcategory.upsert({
    where: {
      id:
        (
          await prisma.menuSubcategory.findFirst({
            where: {
              categoryId: category.id,
              nameEn: "Salads",
            },
          })
        )?.id || "",
    },
    update: {},
    create: {
      categoryId: category.id,
      nameEn: "Salads",
      nameFr: "Salades",
      sortOrder: 1,
    },
  });

  // 4. Upsert the dish
  const dish = await prisma.dish.upsert({
    where: {
      id:
        (
          await prisma.dish.findFirst({
            where: {
              restaurantId: restaurant.id,
              nameEn: "Grilled Chicken",
            },
          })
        )?.id || "",
    },
    update: {},
    create: {
      restaurantId: restaurant.id,
      subcategoryId: subcategory.id,
      nameEn: "Grilled Chicken",
      nameFr: "Poulet grillé",
      descriptionEn: "Juicy grilled chicken breast.",
      descriptionFr: "Poitrine de poulet grillée et juteuse.",
      price: 12.99,
      imageUrl: "/images/chicken.jpg",
      usdzUrl: "/ar/chicken.usdz",
      glbUrl: "/ar/chicken.glb",
      isActive: true,
      isMostPurchased: false,
      sortOrder: 1,
    },
  });

  // 5. Upsert the ingredient
  await prisma.ingredient.upsert({
    where: {
      id:
        (
          await prisma.ingredient.findFirst({
            where: {
              dishId: dish.id,
              nameEn: "Salt",
            },
          })
        )?.id || "",
    },
    update: {},
    create: {
      dishId: dish.id,
      nameEn: "Salt",
      nameFr: "Sel",
    },
  });

  // 6. Upsert Super Admin
  await prisma.user.upsert({
    where: { email: "admin@foodify.test" },
    update: {},
    create: {
      email: "admin@foodify.test",
      passwordHash: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  // 7. Upsert Restaurant Admin
  await prisma.user.upsert({
    where: { email: "owner@foodify.test" },
    update: {},
    create: {
      email: "owner@foodify.test",
      passwordHash: hashedPassword,
      role: "RESTAURANT_ADMIN",
      restaurants: { connect: { id: restaurant.id } },
    },
  });

  console.log("✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
