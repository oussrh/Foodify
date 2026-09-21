'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireRestaurantAccess, requireSuperAdmin } from '@/lib/auth-guard'
import { firstIssue, uuid } from '@/lib/schemas/common'
import { idOnly, restaurantPayload } from '@/lib/payloads'
import { definedFields } from '@/lib/defined-fields'
import { imageUpload, restaurantInput, restaurantPatch, slug, type RestaurantInput, type RestaurantPatch } from '@/lib/schemas/restaurant'

/**
 * The dashboards render on every request and cache nothing on the server; what an open client
 * keeps is the shell of its preserved layout, which lists every restaurant by name. A
 * revalidation makes this action's response carry a fresh render from the root, so the switcher
 * shows a new, renamed or deleted restaurant without a reload (CACHE.1: every write invalidates).
 */
function refreshDashboards() {
  revalidatePath('/admin', 'layout')
  revalidatePath('/manager', 'layout')
}

/**
 * Super admin only. Parses `restaurantInput` (name, a lowercase slug, defaultLocale en or fr; the rest optional), stores
 * the row and revalidates both dashboards' layouts so the switcher lists it without a reload. Answers `restaurantPayload`
 * (id, slug); a taken slug is Prisma's unique error, not a shaped one.
 */
export async function createRestaurant(raw: RestaurantInput) {
  await requireSuperAdmin()
  const data = restaurantInput.parse(raw)
  const restaurant = await prisma.restaurant.create({ data: definedFields(data), select: restaurantPayload })
  refreshDashboards()
  return restaurant
}

/**
 * The restaurant's admin or a super admin: the one restaurant write a manager may make. Parses the id as a UUID and
 * `restaurantPatch` (every field optional, plus menuTheme); an absent member leaves the column, an empty string is
 * stored as one. Revalidates both dashboards' layouts and answers `restaurantPayload` (id, slug).
 */
export async function updateRestaurant(rawId: string, raw: RestaurantPatch) {
  await requireRestaurantAccess({ id: rawId })
  const id = uuid.parse(rawId)
  const data = restaurantPatch.parse(raw)
  const restaurant = await prisma.restaurant.update({ where: { id }, data: definedFields(data), select: restaurantPayload })
  refreshDashboards()
  return restaurant
}

/**
 * Super admin only: a manager cannot delete their own restaurant. Parses the id as a UUID, deletes the row, which the
 * schema cascades to its menu and dishes, refusing while any dish has an ingredient or a view, and revalidates both
 * dashboards' layouts. Answers `{ id }`.
 */
export async function deleteRestaurant(rawId: string) {
  await requireSuperAdmin()
  const id = uuid.parse(rawId)
  const restaurant = await prisma.restaurant.delete({ where: { id }, select: idOnly })
  refreshDashboards()
  return restaurant
}

/**
 * The restaurant's admin or a super admin, the restaurant named by slug. Takes the form's `file` (JPG, PNG, WebP or SVG,
 * at most 5 MB, no double extension) and uploads it to the restaurant's Cloudinary branding folder over the last logo.
 * Answers `{ success: true, logoUrl }`, or `{ success: false, error }` for a refused file or failed upload; no row is written.
 */
export async function uploadRestaurantLogo(formData: FormData, rawSlug: string) {
  await requireRestaurantAccess({ slug: rawSlug })
  const restaurantSlug = slug.parse(rawSlug)
  try {
    const { uploadLogo } = await import('@/lib/cloudinary')
    const parsed = imageUpload(5).safeParse(formData.get('file'))
    if (!parsed.success) throw new Error(firstIssue(parsed.error))
    const file = parsed.data

    const logoUrl = await uploadLogo(file, restaurantSlug)

    return { success: true, logoUrl }
  } catch (error) {
    console.error('Logo upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * The restaurant's admin or a super admin, the restaurant named by slug. Takes the form's `file` (JPG, PNG, WebP or SVG,
 * at most 10 MB, no double extension) and uploads it to the restaurant's Cloudinary branding folder over the last cover.
 * Answers `{ success: true, coverUrl }`, or `{ success: false, error }` for a refused file or failed upload; no row is written.
 */
export async function uploadRestaurantCover(formData: FormData, rawSlug: string) {
  await requireRestaurantAccess({ slug: rawSlug })
  const restaurantSlug = slug.parse(rawSlug)
  try {
    const { uploadCoverImage } = await import('@/lib/cloudinary')
    const parsed = imageUpload(10).safeParse(formData.get('file'))
    if (!parsed.success) throw new Error(firstIssue(parsed.error))
    const file = parsed.data

    const coverUrl = await uploadCoverImage(file, restaurantSlug)

    return { success: true, coverUrl }
  } catch (error) {
    console.error('Cover upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}
