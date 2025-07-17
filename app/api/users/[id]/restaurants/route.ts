import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest, { params }) {
  const { restaurantIds } = await req.json()
  const { id } = params
  if (!Array.isArray(restaurantIds)) {
    return new Response('Invalid restaurantIds', { status: 400 })
  }

  await prisma.user.update({
    where: { id },
    data: {
      restaurants: {
        set: restaurantIds.map((id: string) => ({ id })),
      },
    },
  })

  return Response.json({ success: true })
}
