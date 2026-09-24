import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ok, fail, jsonBody } from '@/lib/api'
import { dishView } from '@/lib/schemas/tracking'
import { log } from '@/server/log'

/**
 * POST, public: the guest menu records a view with no session. Body `{ dishId, arViewed?, deviceType? }` as
 * `dishView` (lib/schemas/tracking) says. Answers 201 `{ data: { viewId, arViewed } }`; 400 invalid_json or invalid_payload (with the
 * issues), 404 not_found for an unknown dish, 500 internal. Nothing dedupes or rate-limits: every accepted call is a row.
 */
export async function POST(request: NextRequest) {
  const body = await jsonBody(request)
  if (body === null) return fail('invalid_json', 'The body is not JSON', 400)

  const parsed = dishView.safeParse(body)
  if (!parsed.success) {
    return fail('invalid_payload', 'Invalid dish view payload', 400, parsed.error.issues)
  }
  const { dishId, arViewed, deviceType } = parsed.data

  try {
    const dish = await prisma.dish.findUnique({ where: { id: dishId }, select: { id: true } })
    if (!dish) {
      return fail('not_found', 'Dish not found', 404)
    }

    const dishView = await prisma.dishView.create({
      data: { dishId, arViewed, deviceType },
    })

    return ok({ viewId: dishView.id, arViewed }, { status: 201 })
  } catch (error) {
    log.error({ err: error, dishId }, 'dish view: not recorded')
    return fail('internal', 'Failed to record dish view', 500)
  }
}
