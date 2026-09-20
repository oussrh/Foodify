import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { authErrorResponse, requireSuperAdmin } from '@/lib/auth-guard'
import { uuid } from '@/lib/schemas/common'

const assignment = z.object({ restaurantIds: z.array(uuid) })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()
  } catch (error) {
    return authErrorResponse(error)
  }

  const body = assignment.safeParse(await req.json().catch(() => null))
  if (!body.success) {
    return new Response('Invalid restaurantIds', { status: 400 })
  }
  const { restaurantIds } = body.data
  const id = uuid.parse((await params).id)

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
