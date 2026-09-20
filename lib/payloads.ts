// lib/payloads.ts
// What a mutation answers, named once per model (API.1: a payload the action shaped, never the
// row). A select keeps a User's hash and tokens on the server and a Dish's Decimal off the wire.
import type { Prisma } from '@/generated/prisma/client'

export const idOnly = { id: true } satisfies Prisma.UserSelect & Prisma.DishSelect & Prisma.RestaurantSelect
export const userPayload = { id: true, email: true } satisfies Prisma.UserSelect
export const dishPayload = { id: true, isActive: true, isMostPurchased: true } satisfies Prisma.DishSelect
export const ingredientPayload = { id: true, nameEn: true, nameFr: true } satisfies Prisma.IngredientSelect
export const categoryPayload = { id: true, nameEn: true, nameFr: true, sortOrder: true, isActive: true } satisfies Prisma.MenuCategorySelect & Prisma.MenuSubcategorySelect
export const restaurantPayload = { id: true, slug: true } satisfies Prisma.RestaurantSelect
