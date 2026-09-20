import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { ok, fail } from '@/lib/api'

// Public endpoint hit by the customer menu, so the body is validated strictly.
const dishViewSchema = z.object({
  dishId: z.uuid(),
  arViewed: z.boolean().default(false),
  deviceType: z.enum(['iOS', 'Android', 'Other']).default('Other'),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('invalid_json', 'The body is not JSON', 400)
  }

  const parsed = dishViewSchema.safeParse(body)
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
    console.error('Error recording dish view:', error)
    return fail('internal', 'Failed to record dish view', 500)
  }
}
