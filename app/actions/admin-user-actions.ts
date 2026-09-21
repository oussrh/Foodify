'use server'

import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { password, uuid } from '@/lib/schemas/common'
import { adminInput, adminPatch, type AdminInput, type AdminPatch } from '@/lib/schemas/user'
import { userPayload } from '@/lib/payloads'
import { definedFields } from '@/lib/defined-fields'

/**
 * Super admin only. Parses `adminInput` (an email and a six-character temporary password), stores the account as
 * SUPER_ADMIN with the password hashed and answers `userPayload` (id, email), never the hash. A taken email is
 * Prisma's unique error, not a shaped one.
 */
export async function createAdmin(raw: AdminInput) {
  await requireSuperAdmin()
  const data = adminInput.parse(raw)
  const passwordHash = await bcrypt.hash(data.password, 10)
  return prisma.user.create({ select: userPayload,
    data: {
      email: data.email,
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  })
}

/**
 * Super admin only. Parses the id as a UUID and `adminPatch` (an optional email); an absent member leaves the
 * column as it is. Neither the role nor the password is patchable here. Answers `userPayload` (id, email).
 */
export async function updateAdmin(rawId: string, raw: AdminPatch) {
  await requireSuperAdmin()
  const id = uuid.parse(rawId)
  const data = adminPatch.parse(raw)
  return prisma.user.update({ select: userPayload,
    where: { id },
    data: definedFields(data),
  })
}

/**
 * Super admin only. Parses the id as a UUID and the new password against `password` (six characters, meant as
 * temporary), stores its hash and stamps the row FORCE_CHANGE; nothing reads that stamp yet, so the next sign-in
 * is not made to change it. Answers `userPayload` (id, email).
 */
export async function resetAdminPassword(rawId: string, newPassword: string) {
  await requireSuperAdmin()
  const id = uuid.parse(rawId)
  const passwordHash = await bcrypt.hash(password.parse(newPassword), 10)
  return prisma.user.update({ select: userPayload,
    where: { id },
    data: {
      passwordHash,
      passwordResetToken: 'FORCE_CHANGE', // a stamp nothing reads yet; see the block above
      passwordResetExpires: null
    },
  })
}
