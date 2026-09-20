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

  const { userIds } = await req.json()
  const { id } = await params
  if (!Array.isArray(userIds) || !userIds.every((u) => typeof u === 'string')) {
    return new Response('Invalid userIds', { status: 400 })
  }

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
