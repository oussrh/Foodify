// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Hash the password
  const hashedPassword = await bcrypt.hash("changeme", 10);

  // 1. Créer le restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Foodify Test Kitchen",
      slug: "foodify-test-kitchen",
      email: "contact@foodify.test",
      defaultLocale: "en",
    },
  });

  // 2. Créer une catégorie liée au restaurant
  const category = await prisma.menuCategory.create({
    data: {
      restaurantId: restaurant.id,
      nameEn: "Starters",
      nameFr: "Entrées",
      sortOrder: 1,
    },
  });

  // 3. Créer une sous-catégorie liée à la catégorie
  const subcategory = await prisma.menuSubcategory.create({
    data: {
      categoryId: category.id,
      nameEn: "Salads",
      nameFr: "Salades",
      sortOrder: 1,
    },
  });

  // 4. Créer un plat lié au restaurant et à la sous-catégorie
  const dish = await prisma.dish.create({
    data: {
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

  // 5. Créer un ingrédient lié au plat
  await prisma.ingredient.create({
    data: {
      dishId: dish.id,
      nameEn: "Salt",
      nameFr: "Sel",
    },
  });

  // 6. Créer des utilisateurs
  await prisma.user.create({
    data: {
      email: "admin@foodify.test",
      passwordHash: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      email: "owner@foodify.test",
      passwordHash: hashedPassword,
      role: "RESTAURANT_ADMIN",
      restaurants: {
        connect: { id: restaurant.id },
      },
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
