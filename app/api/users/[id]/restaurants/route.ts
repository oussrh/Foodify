import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { authErrorResponse, requireSuperAdmin } from '@/lib/auth-guard'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()
  } catch (error) {
    return authErrorResponse(error)
  }

  const { restaurantIds } = await req.json()
  const { id } = await params
  if (!Array.isArray(restaurantIds) || !restaurantIds.every((r) => typeof r === 'string')) {
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
