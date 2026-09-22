// app/actions/restaurant-manager-actions.ts
// Who manages one restaurant, changed from that restaurant's own People tab. A manager adds a
// colleague by typing their address: the older control listed every manager on the platform to
// pick from, which is why it could only ever be a super admin's. Nothing here reaches outside
// the one restaurant the caller was let into.
'use server'

import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { requireRestaurantAccess } from '@/lib/auth-guard'
import { password, uuid } from '@/lib/schemas/common'
import { restaurantManager, type RestaurantManager } from '@/lib/schemas/user'
import { userPayload } from '@/lib/payloads'

/**
 * The restaurant's own manager, or a super admin. Parses the restaurant id as a UUID and
 * `restaurantManager` (an address and an optional password). An address that already manages
 * elsewhere is attached to this restaurant and keeps its password; a new one is created as
 * RESTAURANT_ADMIN with the password given, which is refused as missing. An address belonging to
 * an admin, a tablet or a waiter is refused: a role is never changed from here. Answers
 * `userPayload` (id, email, username), never the hash.
 */
export async function addRestaurantManager(rawRestaurantId: string, raw: RestaurantManager) {
  const restaurantId = uuid.parse(rawRestaurantId)
  await requireRestaurantAccess({ id: restaurantId })
  const data = restaurantManager.parse(raw)

  const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true, role: true } })
  if (existing) {
    if (existing.role !== 'RESTAURANT_ADMIN') throw new Error('That address already belongs to another kind of account')
    return prisma.user.update({
      select: userPayload,
      where: { id: existing.id },
      data: { restaurants: { connect: { id: restaurantId } } },
    })
  }

  if (!data.password) throw new Error('That address is new here, so it needs a password')
  const passwordHash = await bcrypt.hash(data.password, 10)
  return prisma.user.create({
    select: userPayload,
    data: { email: data.email, passwordHash, role: 'RESTAURANT_ADMIN', restaurants: { connect: { id: restaurantId } } },
  })
}

/**
 * The restaurant's own manager, or a super admin. Parses both ids as UUIDs and the new password
 * against `password` (six characters, meant to be handed over and changed), and replaces the
 * manager's hash. Refused for your own account — that is Account settings — and for a manager who
 * also runs another restaurant: setting a password is taking the account, and that account would
 * carry this restaurant's manager into someone else's. A super admin has no such limit.
 * Answers `userPayload` (id, email, username), never the hash.
 */
export async function resetManagerPassword(rawRestaurantId: string, rawUserId: string, rawPassword: string) {
  const restaurantId = uuid.parse(rawRestaurantId)
  const userId = uuid.parse(rawUserId)
  const next = password.parse(rawPassword)
  const me = await requireRestaurantAccess({ id: restaurantId })
  if (me.id === userId) throw new Error('Change your own password in Account settings')

  const user = await prisma.user.findFirst({
    where: { id: userId, role: 'RESTAURANT_ADMIN', restaurants: { some: { id: restaurantId } } },
    select: { restaurants: { select: { id: true } } },
  })
  if (!user) throw new Error('Not a manager of this restaurant')
  if (me.role !== 'SUPER_ADMIN' && user.restaurants.length > 1) {
    throw new Error('They manage other restaurants too, so only a Foodify administrator can reset that password')
  }

  const passwordHash = await bcrypt.hash(next, 10)
  return prisma.user.update({
    select: userPayload,
    where: { id: userId },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
  })
}

/**
 * The restaurant's own manager, or a super admin. Parses both ids as UUIDs and detaches that
 * manager from this one restaurant; the account itself, and every other restaurant it manages,
 * is left alone. A manager may not remove their own access — that is how a restaurant loses its
 * last one by accident, and only a super admin, who is not in the list, could put it back.
 * Answers `userPayload` (id, email, username).
 */
export async function removeRestaurantManager(rawRestaurantId: string, rawUserId: string) {
  const restaurantId = uuid.parse(rawRestaurantId)
  const userId = uuid.parse(rawUserId)
  const me = await requireRestaurantAccess({ id: restaurantId })
  if (me.id === userId) throw new Error('You cannot remove your own access')

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (user?.role !== 'RESTAURANT_ADMIN') throw new Error('Not a manager')
  return prisma.user.update({
    select: userPayload,
    where: { id: userId },
    data: { restaurants: { disconnect: { id: restaurantId } } },
  })
}
