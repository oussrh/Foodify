import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

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
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = dishViewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid dish view payload' }, { status: 400 })
  }
  const { dishId, arViewed, deviceType } = parsed.data

  try {
    const dish = await prisma.dish.findUnique({ where: { id: dishId }, select: { id: true } })
    if (!dish) {
      return NextResponse.json({ error: 'Dish not found' }, { status: 404 })
    }

    const dishView = await prisma.dishView.create({
      data: { dishId, arViewed, deviceType },
    })

    return NextResponse.json({
      success: true,
      viewId: dishView.id,
      message: arViewed ? 'AR view recorded' : 'Dish view recorded',
    })
  } catch (error) {
    console.error('Error recording dish view:', error)
    return NextResponse.json({ error: 'Failed to record dish view' }, { status: 500 })
  }
}
