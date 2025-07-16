import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get('role')
  const users = await prisma.user.findMany({
    where: {
      role: role as any || undefined,
    },
    orderBy: { email: 'asc' },
  })
  return Response.json(users)
}
