import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { authErrorResponse, requireSuperAdmin } from '@/lib/auth-guard'

// An unknown or absent role filters nothing, as before.
const roleFilter = z.enum(['SUPER_ADMIN', 'RESTAURANT_ADMIN']).optional().catch(undefined)

// Used by the assign-users dialog. Only returns the fields the UI needs —
// never the password hash, OTP or reset tokens.
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()
  } catch (error) {
    return authErrorResponse(error)
  }

  const role = roleFilter.parse(request.nextUrl.searchParams.get('role') ?? undefined)

  const users = await prisma.user.findMany({
    where: { role },
    select: { id: true, email: true, role: true },
    orderBy: { email: 'asc' },
  })
  return Response.json(users)
}
