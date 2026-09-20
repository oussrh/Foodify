'use server'

import prisma from '@/lib/prisma'
import { requireRestaurantAccess, requireSuperAdmin } from '@/lib/auth-guard'
import { uuid } from '@/lib/schemas/common'
import { imageUpload, restaurantInput, restaurantPatch, slug, type RestaurantInput, type RestaurantPatch } from '@/lib/schemas/restaurant'

export async function createRestaurant(raw: RestaurantInput) {
  await requireSuperAdmin()
  const data = restaurantInput.parse(raw)
  return prisma.restaurant.create({ data })
}

export async function updateRestaurant(rawId: string, raw: RestaurantPatch) {
  await requireRestaurantAccess({ id: rawId })
  const id = uuid.parse(rawId)
  const data = restaurantPatch.parse(raw)
  console.log('Updating restaurant with ID:', id)
  console.log('Update data:', JSON.stringify(data, null, 2))
  
  const result = await prisma.restaurant.update({ where: { id }, data })
  
  console.log('Restaurant updated in database:', JSON.stringify(result, null, 2))
  
  // Revalidate the page to reflect changes
  const { revalidatePath } = await import('next/cache')
  revalidatePath(`/admin/restaurants/${id}/edit`)
  revalidatePath(`/manager/restaurants/${id}/edit`)
  
  return result
}

export async function deleteRestaurant(rawId: string) {
  await requireSuperAdmin()
  const id = uuid.parse(rawId)
  return prisma.restaurant.delete({ where: { id } })
}

export async function uploadRestaurantLogo(formData: FormData, rawSlug: string) {
  await requireRestaurantAccess({ slug: rawSlug })
  const restaurantSlug = slug.parse(rawSlug)
  try {
    const { uploadLogo } = await import('@/lib/cloudinary')
    const parsed = imageUpload(5).safeParse(formData.get('file'))
    if (!parsed.success) throw new Error(parsed.error.issues[0].message)
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

export async function uploadRestaurantCover(formData: FormData, rawSlug: string) {
  await requireRestaurantAccess({ slug: rawSlug })
  const restaurantSlug = slug.parse(rawSlug)
  try {
    const { uploadCoverImage } = await import('@/lib/cloudinary')
    const parsed = imageUpload(10).safeParse(formData.get('file'))
    if (!parsed.success) throw new Error(parsed.error.issues[0].message)
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
