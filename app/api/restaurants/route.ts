import prisma from '@/lib/prisma'
import { authErrorResponse, requireSuperAdmin } from '@/lib/auth-guard'

// Used by the assign-restaurants dialog.
export async function GET() {
  try {
    await requireSuperAdmin()
  } catch (error) {
    return authErrorResponse(error)
  }

  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  })
  return Response.json(restaurants)
}
