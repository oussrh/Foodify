'use server'

import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { password, uuid } from '@/lib/schemas/common'
import { clientInput, clientPatch, type ClientInput, type ClientPatch } from '@/lib/schemas/user'
import { slugify } from '@/lib/slug'
import { userPayload } from '@/lib/payloads'
import { definedFields } from '@/lib/defined-fields'

export async function createClient(raw: ClientInput) {
  await requireSuperAdmin()
  const data = clientInput.parse(raw)
  const passwordHash = await bcrypt.hash(data.password, 10)

  const restaurantIds = [...(data.restaurantIds ?? [])]
  if (data.restaurantName) {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: data.restaurantName,
        slug: slugify(data.restaurantName),
        defaultLocale: 'en',
      },
    })
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

export async function resetClientPassword(rawId: string, newPassword: string) {
  await requireSuperAdmin()
  const id = uuid.parse(rawId)
  const passwordHash = await bcrypt.hash(password.parse(newPassword), 10)
  return prisma.user.update({ select: userPayload,
    where: { id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
  })
}
