// app/actions/dish-availability-actions.ts
// The kitchen has run out. This is the one write over the menu that a device account has, and it
// is deliberately the smallest one possible: a dish goes off for the rest of the service and
// comes back for the next by itself. Nothing here changes a price, a name, a photo or whether a
// dish is on the menu at all — those stay with the people who run the restaurant.
'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireServiceStaff } from '@/lib/auth-guard'
import { soldOutUntilNextService } from '@/lib/availability'
import { uuid } from '@/lib/schemas/common'

/** Available again, or sold out for the rest of this service. */
const availability = z.object({ soldOut: z.boolean() })
/** `availability` after parsing. */
export type Availability = z.infer<typeof availability>

/**
 * The restaurant's own service staff — a manager, an order tablet, a waiter — or a super admin.
 * Parses the dish id as a UUID and `availability`, and stamps `soldOutUntil` at the end of this
 * service day, or clears it. The restaurant is read from the dish, never taken from the caller,
 * so the guard is asked about the restaurant that actually owns the row. Answers `{ id, soldOut }`.
 */
export async function setDishAvailability(rawDishId: string, raw: Availability) {
  const dishId = uuid.parse(rawDishId)
  const { soldOut } = availability.parse(raw)

  const dish = await prisma.dish.findUnique({ where: { id: dishId }, select: { restaurantId: true } })
  if (!dish) throw new Error('No such dish')
  await requireServiceStaff(dish.restaurantId)

  const row = await prisma.dish.update({
    where: { id: dishId },
    data: { soldOutUntil: soldOut ? soldOutUntilNextService(new Date()) : null },
    select: { id: true, soldOutUntil: true },
  })
  return { id: row.id, soldOut: row.soldOutUntil !== null }
}
