import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Foodify Test Kitchen',
      slug: 'foodify-test-kitchen',
      email: 'contact@foodify.test',
      defaultLocale: 'en',
      categories: {
        create: [
          {
            nameEn: 'Starters',
            nameFr: 'Entrées',
            sortOrder: 1,
            subcategories: {
              create: [
                {
                  nameEn: 'Salads',
                  nameFr: 'Salades',
                  sortOrder: 1
                }
              ]
            }
          }
        ]
      },
      dishes: {
        create: [
          {
            nameEn: 'Grilled Chicken',
            nameFr: 'Poulet grillé',
            descriptionEn: 'Juicy grilled chicken breast.',
            descriptionFr: 'Poitrine de poulet grillée et juteuse.',
            price: 12.99,
            imageUrl: '/images/chicken.jpg',
            usdzUrl: '/ar/chicken.usdz',
            glbUrl: '/ar/chicken.glb',
            isActive: true,
            isMostPurchased: false,
            sortOrder: 1
          }
        ]
      }
    }
  });

  await prisma.user.create({
    data: {
      email: 'admin@foodify.test',
      passwordHash: 'changeme',
      role: 'SUPER_ADMIN'
    }
  });

  await prisma.user.create({
    data: {
      email: 'owner@foodify.test',
      passwordHash: 'changeme',
      role: 'RESTAURANT_ADMIN',
      restaurantId: restaurant.id
    }
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
