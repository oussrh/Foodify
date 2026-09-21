import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api'
import { authErrorResponse, requireSuperAdmin } from '@/lib/auth-guard'
import { assignment, jsonBody } from '@/lib/schemas/assignment'
import { uuid } from '@/lib/schemas/common'

/**
 * POST, super admin only (401 unauthenticated, 403 forbidden, in the envelope). Path id a UUID (400 invalid_id); body
 * `{ userIds: UUID[] }` (400 invalid_payload with the issues, a non-JSON body included). Replaces the restaurant's whole
 * user assignment and answers `{ data: { id, userIds } }` as sent; an unknown restaurant or user id is a bare Prisma 500.
 */
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
  if (!id.success) return fail('invalid_id', 'The path id is not a UUID', 400)
  const body = assignment('userIds').safeParse(await jsonBody(req))
  if (!body.success) return fail('invalid_payload', 'userIds must be an array of UUIDs', 400, body.error.issues)
  const { userIds } = body.data

  await prisma.restaurant.update({
    where: { id: id.data },
    data: {
      users: {
        set: userIds.map((id: string) => ({ id })),
      },
    },
  })

  return ok({ id: id.data, userIds })
}
