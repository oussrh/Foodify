// prisma/seed.ts: sample data for a database. Run by `prisma db seed` through tsx (prisma.config.ts).
// It is idempotent: the restaurant, categories, subcategories and dishes are matched by name and
// created only when missing, and the restaurant's own settings (branding, hours, social) are
// never overwritten, so it is safe to re-run against a database you have been editing by hand.

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { serverEnv } from "../lib/env";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: serverEnv.databaseUrl }) });

const RESTAURANT_SLUG = "foodify-test-kitchen";

type SeedDish = {
  nameEn: string;
  nameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  price: number;
  calories?: number;
  dietary?: string[];
  allergens?: string[];
  ingredients?: [string, string][];
  popular?: boolean;
  glbUrl?: string;
  usdzUrl?: string;
  imageUrl?: string;
};

type SeedSub = { nameEn: string; nameFr: string; dishes: SeedDish[] };
type SeedCategory = { nameEn: string; nameFr: string; subs: SeedSub[] };

// A realistic Moroccan menu. Everything is halal; images are left empty on purpose so the menu
// shows the placeholder until a photo is uploaded, and one dish keeps a GLB for the 3D view.
const MENU: SeedCategory[] = [
  {
    nameEn: "Starters",
    nameFr: "Entrées",
    subs: [
      {
        nameEn: "Salads",
        nameFr: "Salades",
        dishes: [
          { nameEn: "Moroccan Salad", nameFr: "Salade marocaine", descriptionEn: "Diced tomato, cucumber, onion and herbs, lemon dressing.", descriptionFr: "Tomate, concombre, oignon et herbes, vinaigrette au citron.", price: 4.5, calories: 120, dietary: ["vegan", "halal", "gluten_free"], ingredients: [["Tomato", "Tomate"], ["Cucumber", "Concombre"], ["Onion", "Oignon"]] },
          { nameEn: "Zaalouk", nameFr: "Zaalouk", descriptionEn: "Smoked aubergine and tomato, cumin and garlic.", descriptionFr: "Aubergine fumée et tomate, cumin et ail.", price: 5, calories: 180, dietary: ["vegan", "halal", "gluten_free"] },
          { nameEn: "Taktouka", nameFr: "Taktouka", descriptionEn: "Grilled pepper and tomato, paprika.", descriptionFr: "Poivron et tomate grillés, paprika.", price: 5, dietary: ["vegan", "halal", "gluten_free"] },
        ],
      },
      {
        nameEn: "Soups",
        nameFr: "Soupes",
        dishes: [
          { nameEn: "Harira", nameFr: "Harira", descriptionEn: "Tomato, lentil and chickpea soup, fresh coriander.", descriptionFr: "Soupe de tomate, lentilles et pois chiches, coriandre.", price: 4.5, calories: 220, dietary: ["vegetarian", "halal"], allergens: ["gluten"], popular: true },
          { nameEn: "Bissara", nameFr: "Bissara", descriptionEn: "Split-pea purée, olive oil and cumin.", descriptionFr: "Purée de pois cassés, huile d'olive et cumin.", price: 4, dietary: ["vegan", "halal", "gluten_free"] },
        ],
      },
    ],
  },
  {
    nameEn: "Mains",
    nameFr: "Plats principaux",
    subs: [
      {
        nameEn: "Tagines",
        nameFr: "Tajines",
        dishes: [
          { nameEn: "Lamb Tagine with Prunes", nameFr: "Tajine d'agneau aux pruneaux", descriptionEn: "Slow-cooked lamb, prunes, toasted almonds and sesame.", descriptionFr: "Agneau mijoté, pruneaux, amandes grillées et sésame.", price: 16.5, calories: 640, dietary: ["halal"], allergens: ["nuts", "sesame"], ingredients: [["Lamb", "Agneau"], ["Prunes", "Pruneaux"], ["Almonds", "Amandes"]], popular: true },
          { nameEn: "Chicken Tagine with Preserved Lemon", nameFr: "Tajine de poulet au citron confit", descriptionEn: "Chicken, preserved lemon, green olives and saffron.", descriptionFr: "Poulet, citron confit, olives vertes et safran.", price: 14.5, calories: 520, dietary: ["halal", "gluten_free"] },
          { nameEn: "Kefta Tagine", nameFr: "Tajine de kefta", descriptionEn: "Spiced meatballs in tomato sauce with baked eggs.", descriptionFr: "Boulettes épicées en sauce tomate et œufs.", price: 13.5, dietary: ["halal"], allergens: ["eggs"] },
          { nameEn: "Vegetable Tagine", nameFr: "Tajine de légumes", descriptionEn: "Seasonal vegetables, chickpeas and ras el hanout.", descriptionFr: "Légumes de saison, pois chiches et ras el hanout.", price: 11.5, calories: 380, dietary: ["vegan", "halal", "gluten_free"] },
        ],
      },
      {
        nameEn: "Couscous",
        nameFr: "Couscous",
        dishes: [
          { nameEn: "Seven-Vegetable Couscous", nameFr: "Couscous aux sept légumes", descriptionEn: "Steamed semolina and seven vegetables in broth.", descriptionFr: "Semoule vapeur et sept légumes en bouillon.", price: 12.5, calories: 560, dietary: ["vegan", "halal"], allergens: ["gluten"], popular: true },
          { nameEn: "Lamb Couscous", nameFr: "Couscous à l'agneau", descriptionEn: "Semolina, tender lamb and vegetables.", descriptionFr: "Semoule, agneau fondant et légumes.", price: 16, dietary: ["halal"], allergens: ["gluten"] },
          { nameEn: "Chicken Couscous", nameFr: "Couscous au poulet", descriptionEn: "Semolina, chicken and caramelised onion.", descriptionFr: "Semoule, poulet et oignon caramélisé.", price: 14, dietary: ["halal"], allergens: ["gluten"] },
        ],
      },
    ],
  },
  {
    nameEn: "Grills",
    nameFr: "Grillades",
    subs: [
      {
        nameEn: "Skewers",
        nameFr: "Brochettes",
        dishes: [
          { nameEn: "Grilled Chicken", nameFr: "Poulet grillé", descriptionEn: "Chermoula-marinated chicken breast, grilled.", descriptionFr: "Blanc de poulet mariné à la chermoula, grillé.", price: 12.99, calories: 410, dietary: ["halal", "gluten_free"], glbUrl: "/ar/chicken.glb", usdzUrl: "/ar/chicken.usdz", imageUrl: "/images/chicken.svg", ingredients: [["Chicken", "Poulet"], ["Chermoula", "Chermoula"]], popular: true },
          { nameEn: "Kefta Skewers", nameFr: "Brochettes de kefta", descriptionEn: "Minced beef skewers, cumin and paprika.", descriptionFr: "Brochettes de bœuf haché, cumin et paprika.", price: 11.5, dietary: ["halal", "gluten_free"] },
          { nameEn: "Mixed Grill", nameFr: "Grillade mixte", descriptionEn: "Chicken, kefta and merguez, grilled peppers.", descriptionFr: "Poulet, kefta et merguez, poivrons grillés.", price: 17.5, calories: 720, dietary: ["halal", "gluten_free"] },
        ],
      },
      {
        nameEn: "From the Oven",
        nameFr: "Du four",
        dishes: [
          { nameEn: "Chicken Pastilla", nameFr: "Pastilla au poulet", descriptionEn: "Flaky pastry, chicken, almonds and cinnamon sugar.", descriptionFr: "Pâte feuilletée, poulet, amandes et sucre-cannelle.", price: 13, calories: 560, dietary: ["halal"], allergens: ["gluten", "nuts", "eggs"], popular: true },
          { nameEn: "Mechoui", nameFr: "Méchoui", descriptionEn: "Slow-roast lamb shoulder, cumin salt.", descriptionFr: "Épaule d'agneau rôtie, sel au cumin.", price: 18, dietary: ["halal", "gluten_free"] },
        ],
      },
    ],
  },
  {
    nameEn: "Desserts",
    nameFr: "Desserts",
    subs: [
      {
        nameEn: "Pastries",
        nameFr: "Pâtisseries",
        dishes: [
          { nameEn: "Chebakia", nameFr: "Chebakia", descriptionEn: "Sesame flower pastry in honey.", descriptionFr: "Pâtisserie au sésame et miel.", price: 3.5, dietary: ["vegetarian", "halal"], allergens: ["gluten", "sesame"] },
          { nameEn: "Kaab el Ghazal", nameFr: "Kaab el Ghazal", descriptionEn: "Almond-paste crescents, orange blossom.", descriptionFr: "Croissants à la pâte d'amande, fleur d'oranger.", price: 4, dietary: ["vegetarian", "halal"], allergens: ["gluten", "nuts"], popular: true },
        ],
      },
      {
        nameEn: "Sweet",
        nameFr: "Douceurs",
        dishes: [
          { nameEn: "Muhallabia", nameFr: "Mhalbi", descriptionEn: "Rose-water milk pudding, cinnamon.", descriptionFr: "Crème au lait et eau de rose, cannelle.", price: 4, calories: 240, dietary: ["vegetarian", "halal", "gluten_free"], allergens: ["dairy"] },
          { nameEn: "Sellou", nameFr: "Sellou", descriptionEn: "Toasted flour, almonds and honey.", descriptionFr: "Farine grillée, amandes et miel.", price: 3.5, dietary: ["vegetarian", "halal"], allergens: ["gluten", "nuts"] },
        ],
      },
    ],
  },
  {
    nameEn: "Drinks",
    nameFr: "Boissons",
    subs: [
      {
        nameEn: "Hot",
        nameFr: "Chaudes",
        dishes: [
          { nameEn: "Mint Tea", nameFr: "Thé à la menthe", descriptionEn: "Green tea, fresh mint and sugar.", descriptionFr: "Thé vert, menthe fraîche et sucre.", price: 2, dietary: ["vegan", "halal", "gluten_free"], popular: true },
          { nameEn: "Moroccan Coffee", nameFr: "Café marocain", descriptionEn: "Spiced coffee with a hint of cardamom.", descriptionFr: "Café épicé, pointe de cardamome.", price: 2.5, dietary: ["vegan", "halal", "gluten_free"] },
          { nameEn: "Nous-Nous", nameFr: "Nous-Nous", descriptionEn: "Half espresso, half steamed milk.", descriptionFr: "Moitié espresso, moitié lait chaud.", price: 2.5, dietary: ["vegetarian", "halal", "gluten_free"], allergens: ["dairy"] },
        ],
      },
      {
        nameEn: "Cold",
        nameFr: "Fraîches",
        dishes: [
          { nameEn: "Fresh Orange Juice", nameFr: "Jus d'orange frais", descriptionEn: "Squeezed to order.", descriptionFr: "Pressé à la commande.", price: 3, dietary: ["vegan", "halal", "gluten_free"] },
          { nameEn: "Avocado Smoothie", nameFr: "Smoothie à l'avocat", descriptionEn: "Avocado, milk, almonds and honey.", descriptionFr: "Avocat, lait, amandes et miel.", price: 4, calories: 320, dietary: ["vegetarian", "halal", "gluten_free"], allergens: ["dairy", "nuts"] },
          { nameEn: "Almond Milk", nameFr: "Lait d'amande", descriptionEn: "Chilled almond milk, orange blossom.", descriptionFr: "Lait d'amande glacé, fleur d'oranger.", price: 3.5, dietary: ["vegan", "halal", "gluten_free"], allergens: ["nuts"] },
        ],
      },
    ],
  },
];

async function seedRestaurant() {
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: RESTAURANT_SLUG },
    update: {}, // never overwrite the restaurant's own settings
    create: {
      name: "Foodify Test Kitchen",
      slug: RESTAURANT_SLUG,
      code: 'SEED01',
      email: "contact@foodify.test",
      tagline: "AR dining reinvented",
      logoUrl: "/images/logo.png",
      colorTheme: "#1F6B49",
      defaultLocale: "en",
      currency: "EUR",
      currencySymbol: "€",
      orderingEnabled: true,
    },
  });
  console.log("✅ Restaurant:", restaurant.name);
  return restaurant;
}

/** Create the dish under its subcategory if no dish of that name exists for the restaurant. */
async function seedDish(restaurantId: string, subcategoryId: string, d: SeedDish, sortOrder: number) {
  const existing = await prisma.dish.findFirst({ where: { restaurantId, nameEn: d.nameEn }, select: { id: true } });
  if (existing) return;
  const dish = await prisma.dish.create({
    data: {
      restaurantId,
      subcategoryId,
      nameEn: d.nameEn,
      nameFr: d.nameFr,
      descriptionEn: d.descriptionEn,
      descriptionFr: d.descriptionFr,
      price: d.price,
      imageUrl: d.imageUrl ?? "",
      usdzUrl: d.usdzUrl ?? "",
      glbUrl: d.glbUrl ?? "",
      calories: d.calories ?? null,
      dietary: d.dietary ?? [],
      allergens: d.allergens ?? [],
      isActive: true,
      isMostPurchased: d.popular ?? false,
      sortOrder,
      ...(d.ingredients ? { ingredients: { create: d.ingredients.map(([nameEn, nameFr]) => ({ nameEn, nameFr })) } } : {}),
    },
  });
  console.log("  ✅ Dish:", dish.nameEn);
}

/** Create the whole menu tree, each node only when missing. */
async function seedMenu(restaurantId: string) {
  let catOrder = 0;
  for (const cat of MENU) {
    let category = await prisma.menuCategory.findFirst({ where: { restaurantId, nameEn: cat.nameEn }, select: { id: true } });
    if (!category) {
      category = await prisma.menuCategory.create({ data: { restaurantId, nameEn: cat.nameEn, nameFr: cat.nameFr, sortOrder: catOrder }, select: { id: true } });
      console.log("✅ Category:", cat.nameEn);
    }
    catOrder += 1;

    let subOrder = 0;
    for (const sub of cat.subs) {
      let subcategory = await prisma.menuSubcategory.findFirst({ where: { categoryId: category.id, nameEn: sub.nameEn }, select: { id: true } });
      if (!subcategory) {
        subcategory = await prisma.menuSubcategory.create({ data: { categoryId: category.id, nameEn: sub.nameEn, nameFr: sub.nameFr, sortOrder: subOrder }, select: { id: true } });
        console.log(" ✅ Subcategory:", sub.nameEn);
      }
      subOrder += 1;

      let dishOrder = 0;
      for (const dish of sub.dishes) {
        await seedDish(restaurantId, subcategory.id, dish, dishOrder);
        dishOrder += 1;
      }
    }
  }
}

async function seedSuperAdmin(hashedPassword: string) {
  await prisma.user.upsert({
    where: { email: "ousrh7@gmail.com" },
    update: { lastLogin: new Date() },
    create: { email: "ousrh7@gmail.com", passwordHash: hashedPassword, role: "SUPER_ADMIN", emailVerified: new Date() },
  });
  console.log("✅ Super Admin: ousrh7@gmail.com");
}

async function seedRestaurantAdmin(hashedPassword: string, restaurantId: string) {
  const restaurantAdmin = await prisma.user.upsert({
    where: { email: "owner@foodify.test" },
    update: { lastLogin: new Date() },
    create: { email: "owner@foodify.test", passwordHash: hashedPassword, role: "RESTAURANT_ADMIN", emailVerified: new Date() },
  });
  await prisma.restaurant.update({ where: { id: restaurantId }, data: { users: { connect: { id: restaurantAdmin.id } } } });
  console.log("✅ Restaurant Admin: owner@foodify.test");
}

async function main() {
  console.log("🌱 Seeding…");
  try {
    const hashedPassword = await bcrypt.hash("changeme", 10);
    const restaurant = await seedRestaurant();
    await seedMenu(restaurant.id);
    await seedSuperAdmin(hashedPassword);
    await seedRestaurantAdmin(hashedPassword, restaurant.id);
    const dishes = await prisma.dish.count({ where: { restaurantId: restaurant.id } });
    console.log(`🎉 Done. ${MENU.length} categories, ${MENU.reduce((n, c) => n + c.subs.length, 0)} subcategories, ${dishes} dishes.`);
    console.log("   Super Admin: ousrh7@gmail.com · Restaurant Admin: owner@foodify.test · password: changeme");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

main()
  .catch(() => process.exit(1))
  .finally(async () => {
    await prisma.$disconnect();
  });
