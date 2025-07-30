'use server'

import prisma from '@/lib/prisma'

export async function listRestaurants() {
  return prisma.restaurant.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function createRestaurant(data: {
  name: string
  slug: string
  email?: string
  phone?: string
  tagline?: string
  logoUrl?: string
  colorTheme?: string
  defaultLocale: 'en' | 'fr'
  // Address fields
  streetAddress?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  // Business info fields
  website?: string
  description?: string
  cuisineType?: string
  priceRange?: '$' | '$$' | '$$$' | '$$$$'
  openingHours?: string
  socialMedia?: string
  // Design fields
  coverImageUrl?: string
  coverImageStyle?: 'cover' | 'repeat'
  secondaryColor?: string
  fontFamily?: string
  googleFontUrl?: string
  // Business settings
  currency?: string
  currencySymbol?: string
}) {
  return prisma.restaurant.create({ data })
}

export async function updateRestaurant(
  id: string,
  data: {
    name?: string
    slug?: string
    email?: string
    phone?: string
    tagline?: string
    logoUrl?: string
    colorTheme?: string
    defaultLocale?: 'en' | 'fr'
    // Address fields
    streetAddress?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    // Business info fields
    website?: string
    description?: string
    cuisineType?: string
    priceRange?: '$' | '$$' | '$$$' | '$$$$'
    openingHours?: string
    socialMedia?: string
    // Design fields
    coverImageUrl?: string
    coverImageStyle?: 'cover' | 'repeat'
    secondaryColor?: string
    fontFamily?: string
    googleFontUrl?: string
    // Business settings
    currency?: string
    currencySymbol?: string
  }
) {
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

export async function deleteRestaurant(id: string) {
  return prisma.restaurant.delete({ where: { id } })
}

export async function listRestaurantsForUser(userId: string) {
  return prisma.restaurant.findMany({
    where: { users: { some: { id: userId } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function uploadRestaurantLogo(formData: FormData, restaurantSlug: string) {
  try {
    const { uploadLogo } = await import('@/lib/cloudinary')
    
    const file = formData.get('file') as File
    if (!file) {
      throw new Error('No file provided')
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please select a JPG, PNG, WebP, or SVG file.')
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB')
    }

    // Check for double extensions
    if (file.name.match(/\.(svg|png|jpg|jpeg|webp)\.(png|jpg|jpeg|webp)$/i)) {
      throw new Error('File appears to have a double extension. Please rename the file and try again.')
    }

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

export async function uploadRestaurantCover(formData: FormData, restaurantSlug: string) {
  try {
    const { uploadCoverImage } = await import('@/lib/cloudinary')
    
    const file = formData.get('file') as File
    if (!file) {
      throw new Error('No file provided')
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please select a JPG, PNG, WebP, or SVG file.')
    }

    // Validate file size (max 10MB for cover images)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB')
    }

    // Check for double extensions
    if (file.name.match(/\.(svg|png|jpg|jpeg|webp)\.(png|jpg|jpeg|webp)$/i)) {
      throw new Error('File appears to have a double extension. Please rename the file and try again.')
    }

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
