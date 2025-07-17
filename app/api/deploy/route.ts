import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Security check
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    if (process.env.NODE_ENV === 'production' && secret !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Testing database connection...')

    // Test database connection and check if tables exist
    try {
      // Try to query a table to see if schema exists
      const restaurantCount = await prisma.restaurant.count()
      console.log('Database tables exist, restaurant count:', restaurantCount)
      
      return NextResponse.json({
        success: true,
        message: 'Database is ready',
        tablesExist: true,
        restaurantCount
      })
    } catch (error) {
      console.log('Database tables do not exist or connection failed:', error)
      
      return NextResponse.json({
        success: false,
        message: 'Database tables do not exist. Please run migrations.',
        tablesExist: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        instructions: {
          step1: 'Go to your Neon dashboard: https://console.neon.tech',
          step2: 'Connect to your database',
          step3: 'Run: npx prisma db push',
          step4: 'Or use the SQL tab and run the migration manually'
        }
      })
    }

  } catch (error) {
    console.error('Deploy check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check database status', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}