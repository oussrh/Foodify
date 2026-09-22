// lib/payloads.ts
// What a mutation answers, named once per model (API.1: a payload the action shaped, never the
// row). A select keeps a User's hash and tokens on the server and a Dish's Decimal off the wire.
import type { Prisma } from '@/generated/prisma/client'

/** What a delete answers: the id and nothing else, so a client cannot read a row that no longer exists. */
export const idOnly = { id: true } satisfies Prisma.UserSelect & Prisma.DishSelect & Prisma.RestaurantSelect
/** A user as a mutation answers it: never the password hash, the OTP or a reset token (a User row carries all three). `username` is how a device account is known; null for a person. */
export const userPayload = { id: true, email: true, username: true } satisfies Prisma.UserSelect
/** A dish as a mutation answers it: the two flags the lists toggle; `price` (a Decimal the wire cannot carry) stays off it. */
export const dishPayload = { id: true, isActive: true, isMostPurchased: true } satisfies Prisma.DishSelect
/** An ingredient as a mutation answers it: what the ingredient manager renders in place. */
export const ingredientPayload = { id: true, nameEn: true, nameFr: true } satisfies Prisma.IngredientSelect
/** A category or subcategory as a mutation answers it (one select serves both levels): names, order and the active flag the managers render. */
export const categoryPayload = { id: true, nameEn: true, nameFr: true, sortOrder: true, isActive: true } satisfies Prisma.MenuCategorySelect & Prisma.MenuSubcategorySelect
/** A restaurant as a mutation answers it: the id and the slug the client navigates to next. */
export const restaurantPayload = { id: true, slug: true } satisfies Prisma.RestaurantSelect
