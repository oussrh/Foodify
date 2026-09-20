import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api'
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
  if (!id.success) return fail('invalid_id', 'The path id is not a UUID', 400)
  const body = assignment('restaurantIds').safeParse(await jsonBody(req))
  if (!body.success) return fail('invalid_payload', 'restaurantIds must be an array of UUIDs', 400, body.error.issues)
  const { restaurantIds } = body.data

  await prisma.user.update({
    where: { id: id.data },
    data: {
      restaurants: {
        set: restaurantIds.map((id: string) => ({ id })),
      },
    },
  })

  return ok({ id: id.data, restaurantIds })
}
