import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { ok, fail } from '@/lib/api'
import { log } from '@/server/log'

// Public endpoint hit by the guest menu with no session, so the body is validated strictly and
// the restaurant is read from the dish rather than taken from the caller.
const cartAddSchema = z.object({ dishId: z.uuid() })

/**
 * POST, public: the guest menu records that a dish went into an order. Body `{ dishId }`. The
 * restaurant is the dish's own, never the body's — a caller cannot credit one restaurant's
 * interest to another. A restaurant not taking orders records nothing (204): its menu shows no
 * cart, so a call for it is noise. Answers 201 `{ data: { id } }`; 400 invalid_json or
 * invalid_payload (with the issues), 404 not_found for an unknown dish, 500 internal. Nothing
 * dedupes or rate-limits: every accepted call is a row, as with a dish view.
 */
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('invalid_json', 'The body is not JSON', 400)
  }

  const parsed = cartAddSchema.safeParse(body)
  if (!parsed.success) return fail('invalid_payload', 'Invalid cart add payload', 400, parsed.error.issues)
  const { dishId } = parsed.data

  try {
    const dish = await prisma.dish.findUnique({
      where: { id: dishId },
      select: { id: true, restaurantId: true, restaurant: { select: { orderingEnabled: true } } },
    })
    if (!dish) return fail('not_found', 'Dish not found', 404)
    if (!dish.restaurant.orderingEnabled) return ok({ id: null })

    const row = await prisma.cartAdd.create({ data: { dishId, restaurantId: dish.restaurantId }, select: { id: true } })
    return ok({ id: row.id }, { status: 201 })
  } catch (error) {
    log.error({ err: error, dishId }, 'cart add: not recorded')
    return fail('internal', 'Failed to record the cart add', 500)
  }
}
