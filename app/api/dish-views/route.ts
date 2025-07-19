import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dishId, arViewed = false, deviceType = 'Other' } = body

    if (!dishId) {
      return NextResponse.json(
        { error: 'Dish ID is required' },
        { status: 400 }
      )
    }

    // Create dish view record
    const dishView = await prisma.dishView.create({
      data: {
        dishId,
        arViewed,
        deviceType,
        viewedAt: new Date(),
      },
    })

    return NextResponse.json({ 
      success: true, 
      viewId: dishView.id,
      message: arViewed ? 'AR view recorded' : 'Dish view recorded'
    })
  } catch (error) {
    console.error('Error recording dish view:', error)
    return NextResponse.json(
      { error: 'Failed to record dish view' },
      { status: 500 }
    )
  }
}