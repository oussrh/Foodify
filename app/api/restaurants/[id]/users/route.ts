import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { authErrorResponse, requireSuperAdmin } from '@/lib/auth-guard'
import { uuid } from '@/lib/schemas/common'

const assignment = z.object({ userIds: z.array(uuid) })

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
    return new Response('Invalid userIds', { status: 400 })
  }
  const { userIds } = body.data
  const id = uuid.parse((await params).id)

  await prisma.restaurant.update({
    where: { id },
    data: {
      users: {
        set: userIds.map((id: string) => ({ id })),
      },
    },
  })

  return Response.json({ success: true })
}
