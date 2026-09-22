'use server'

import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { requireRestaurantAccess, requireSuperAdmin } from '@/lib/auth-guard'
import { isDeviceAccount } from '@/lib/roles'
import { idOnly, userPayload } from '@/lib/payloads'
import { password, uuid } from '@/lib/schemas/common'
import { staffAccount, staffRole, type StaffAccount, type StaffRole } from '@/lib/schemas/staff'

/**
 * The account a staff action was given, if the caller may touch it: it must be a device (never a
 * manager or an admin, who are reached through their own actions), and the caller must run every
 * restaurant it belongs to. A device with no restaurant is a super admin's to clean up.
 */
async function requireDeviceOfMine(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true, restaurants: { select: { id: true } } } })
  if (!user || !isDeviceAccount(user.role)) throw new Error('Not a staff account')
  if (user.restaurants.length === 0) await requireSuperAdmin()
  // Every one of them: a device shared by two restaurants is not one manager's to delete.
  for (const restaurant of user.restaurants) await requireRestaurantAccess({ id: restaurant.id })
}

/**
 * The restaurant's own manager, or a super admin. Creates one of its staff accounts — an order tablet or a waiter — assigned to it, with
 * the second factor off and staying off (`setMfaEnabled` refuses both). Parses the role and `staffAccount`; a taken
 * username is Prisma's unique error. Neither role passes a management guard, so assigning one grants no write to the
 * menu, the dishes, the settings or the people. Answers `userPayload` (id, email).
 */
export async function createStaffUser(rawRestaurantId: string, rawRole: string, raw: StaffAccount) {
  const restaurantId = uuid.parse(rawRestaurantId)
  await requireRestaurantAccess({ id: restaurantId })
  const role: StaffRole = staffRole.parse(rawRole)
  const account = staffAccount.parse(raw)
  return prisma.user.create({
    select: userPayload,
    data: {
      username: account.username,
      // `email` is required and unique on every account, but a device has no mailbox: the address
      // is derived from the name on `.invalid`, the domain reserved so it can never be routed.
      email: `${account.username}@staff.invalid`,
      passwordHash: await bcrypt.hash(account.password, 10),
      role,
      mfaEnabled: false,
      restaurants: { connect: { id: restaurantId } },
    },
  })
}

/**
 * The restaurant's own manager, or a super admin. Sets a new password on a staff account — what you do when a tablet is replaced or a password has
 * been seen. Parses the id and the same password rule every admin-set password obeys, and refuses an account that is
 * not staff. Answers `userPayload`.
 */
export async function resetStaffPassword(rawId: string, rawPassword: string) {
  const id = uuid.parse(rawId)
  const next = password.parse(rawPassword)
  await requireDeviceOfMine(id)
  return prisma.user.update({ select: userPayload, where: { id }, data: { passwordHash: await bcrypt.hash(next, 10) } })
}

/** The restaurant's own manager, or a super admin. Deletes a staff account, refusing anything that is not one. Answers `{ id }`. */
export async function deleteStaffUser(rawId: string) {
  const id = uuid.parse(rawId)
  await requireDeviceOfMine(id)
  return prisma.user.delete({ select: idOnly, where: { id } })
}
