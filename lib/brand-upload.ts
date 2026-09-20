// lib/brand-upload.ts  (client-side)
// Uploads a restaurant's logo or cover image: straight to Cloudinary when the unsigned
// preset is configured, otherwise through the server action. Returns the public URL.
import { uploadRestaurantCover, uploadRestaurantLogo } from '@/app/actions/restaurant-actions'

export type BrandImageKind = 'logo' | 'cover'

export const BRAND_IMAGE_LIMITS = {
  logo: { maxBytes: 5 * 1024 * 1024, types: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'], hint: 'PNG, SVG, JPG or WebP · square works best · up to 5 MB' },
  cover: { maxBytes: 10 * 1024 * 1024, types: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'], hint: 'JPG, PNG or WebP · wide photo, at least 1600 px · up to 10 MB' },
} as const

export function validateBrandImage(file: File, kind: BrandImageKind): string | null {
  const limits = BRAND_IMAGE_LIMITS[kind]
  if (!(limits.types as readonly string[]).includes(file.type)) return `That file type is not supported. ${limits.hint}.`
  if (file.size > limits.maxBytes) return `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit is ${limits.maxBytes / 1024 / 1024} MB.`
  if (/\.(svg|png|jpe?g|webp)\.(png|jpe?g|webp)$/i.test(file.name)) return 'The file has a double extension. Rename it and try again.'
  return null
}

async function uploadDirect(file: File, kind: BrandImageKind, slug: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !preset) throw new Error('Direct upload not configured')
  const body = new FormData()
  body.append('file', file)
  body.append('upload_preset', preset)
  body.append('folder', `restaurants/${slug}/branding`)
  body.append('public_id', kind)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body })
  if (!res.ok) throw new Error(`Upload failed (${res.status})`)
  const json = await res.json()
  if (json.error || !json.secure_url) throw new Error(json.error?.message || 'Upload failed')
  return json.secure_url as string
}

export async function uploadBrandImage(file: File, kind: BrandImageKind, slug: string): Promise<string> {
  try {
    return await uploadDirect(file, kind, slug)
  } catch (directError) {
    console.warn('Direct upload failed, using the server:', directError)
    const body = new FormData()
    body.append('file', file)
    const result = kind === 'logo' ? await uploadRestaurantLogo(body, slug) : await uploadRestaurantCover(body, slug)
    if (!result.success) throw new Error(result.error || 'Upload failed')
    const url = kind === 'logo' ? (result as { logoUrl?: string }).logoUrl : (result as { coverUrl?: string }).coverUrl
    if (!url) throw new Error('Upload returned no URL')
    return url
  }
}
