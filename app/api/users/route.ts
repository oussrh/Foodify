import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { authErrorResponse, requireSuperAdmin } from '@/lib/auth-guard'

const ROLES = ['SUPER_ADMIN', 'RESTAURANT_ADMIN'] as const
type Role = (typeof ROLES)[number]

// Used by the assign-users dialog. Only returns the fields the UI needs —
// never the password hash, OTP or reset tokens.
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()
  } catch (error) {
    return authErrorResponse(error)
  }

  const roleParam = request.nextUrl.searchParams.get('role')
  const role = ROLES.includes(roleParam as Role) ? (roleParam as Role) : undefined

  const users = await prisma.user.findMany({
    where: { role },
    select: { id: true, email: true, role: true },
    orderBy: { email: 'asc' },
  })
  return Response.json(users)
}
