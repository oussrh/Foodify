import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { authErrorResponse, requireSuperAdmin } from '@/lib/auth-guard'
import { assignment, jsonBody } from '@/lib/schemas/assignment'
import { uuid } from '@/lib/schemas/common'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()
  } catch (error) {
    return authErrorResponse(error)
  }

  const id = uuid.safeParse((await params).id)
  if (!id.success) return new Response('Invalid id', { status: 400 })
  const body = assignment('restaurantIds').safeParse(await jsonBody(req))
  if (!body.success) return new Response('Invalid restaurantIds', { status: 400 })
  const { restaurantIds } = body.data

  await prisma.user.update({
    where: { id: id.data },
    data: {
      restaurants: {
        set: restaurantIds.map((id: string) => ({ id })),
      },
    },
  })

  return Response.json({ success: true })
}
