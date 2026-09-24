'use server'

import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { password, uuid } from '@/lib/schemas/common'
import { clientInput, clientPatch, type ClientInput, type ClientPatch } from '@/lib/schemas/user'
import { slugify } from '@/lib/slug'
import { userPayload } from '@/lib/payloads'
import { definedFields } from '@/lib/defined-fields'
import { withRestaurantCode } from '@/server/restaurant-code-assign'

/**
 * Super admin only. Parses `clientInput` (email, temporary password, optional restaurant ids, optional restaurant name);
 * a name creates a restaurant first (slug from the name, locale en) and assigns it with the ids, in a write of its own,
 * so a taken email leaves that restaurant with no admin. Stores the account as RESTAURANT_ADMIN; answers `userPayload` (id, email).
 */
export async function createClient(raw: ClientInput) {
  await requireSuperAdmin()
  const data = clientInput.parse(raw)
  const passwordHash = await bcrypt.hash(data.password, 10)

  const restaurantIds = [...(data.restaurantIds ?? [])]
  const restaurantName = data.restaurantName
  if (restaurantName) {
    const restaurant = await withRestaurantCode((code) =>
      prisma.restaurant.create({
        data: {
          name: restaurantName,
          slug: slugify(restaurantName),
          defaultLocale: 'en',
          code,
        },
      }),
    )
    restaurantIds.push(restaurant.id)
  }

  return prisma.user.create({ select: userPayload,
    data: {
      email: data.email,
      passwordHash,
      role: 'RESTAURANT_ADMIN',
      restaurants: { connect: restaurantIds.map((id: string) => ({ id })) },
    },
  })
}

/**
 * Super admin only. Parses the id as a UUID and `clientPatch` (optional email, optional restaurant ids); ids given
 * replace the whole assignment, ids absent leave it, and the password is not patchable here. Answers `userPayload`.
 */
export async function updateClient(rawId: string, raw: ClientPatch) {
  await requireSuperAdmin()
  const id = uuid.parse(rawId)
  const data = clientPatch.parse(raw)
  const { restaurantIds, ...rest } = data
  return prisma.user.update({ select: userPayload,
    where: { id },
    data: {
      ...definedFields(rest),
      ...(restaurantIds ? { restaurants: { set: restaurantIds.map((id: string) => ({ id })) } } : {}),
    },
  })
}

/**
 * Super admin only. Parses the id as a UUID and the new password against `password` (six characters, meant as temporary),
 * stores its hash and clears any reset marker: unlike an admin's reset, the row is not stamped. Answers `userPayload`.
 */
export async function resetClientPassword(rawId: string, newPassword: string) {
  await requireSuperAdmin()
  const id = uuid.parse(rawId)
  const passwordHash = await bcrypt.hash(password.parse(newPassword), 10)
  return prisma.user.update({ select: userPayload,
    where: { id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
  })
}
