import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userIds } = await req.json()
  const { id } = await params
  if (!Array.isArray(userIds)) {
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
