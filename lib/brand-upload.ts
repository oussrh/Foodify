// lib/brand-upload.ts  (client-side)
// Uploads a restaurant's logo or cover image: straight to Cloudinary when the unsigned
// preset is configured, otherwise through the server action the caller passes in
// (lib/ never imports app/actions — see .dependency-cruiser.cjs). Returns the public URL.
import { publicEnv } from '@/lib/env'
import { firstIssue } from '@/lib/schemas/common'
import { imageUpload } from '@/lib/schemas/restaurant'

/** Which of the two brand images a tile edits; it is also the Cloudinary public id, so a new upload replaces the old file. */
export type BrandImageKind = 'logo' | 'cover'

/** Shape of `uploadRestaurantLogo` / `uploadRestaurantCover` from app/actions/restaurant-actions. */
export type BrandUploadAction = (
  body: FormData,
  slug: string,
) => Promise<{ success: boolean; error?: string; logoUrl?: string; coverUrl?: string }>

/** The limits per image kind: `maxMb` is the server's `imageUpload(5|10)`, `types` narrows it (an SVG cover is refused here already); `hint` is the tile's caption. */
export const BRAND_IMAGE_LIMITS = {
  logo: { maxMb: 5, types: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'], hint: 'PNG, SVG, JPG or WebP · square works best · up to 5 MB' },
  cover: { maxMb: 10, types: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'], hint: 'JPG, PNG or WebP · wide photo, at least 1600 px · up to 10 MB' },
} as const

/**
 * The message to show before any upload starts, or null when the file may go: the server action's
 * own schema (`imageUpload` at the kind's size: type, size, double extension), then the kind's
 * narrower type list (an SVG logo is fine, an SVG cover is not). It exists so the tile can refuse
 * without a network round trip, with the message the server would have given.
 */
export function validateBrandImage(file: File, kind: BrandImageKind): string | null {
  const limits = BRAND_IMAGE_LIMITS[kind]
  const parsed = imageUpload(limits.maxMb).safeParse(file)
  if (!parsed.success) return firstIssue(parsed.error)
  if (!(limits.types as readonly string[]).includes(file.type)) return `That file type is not supported. ${limits.hint}.`
  return null
}

async function uploadDirect(file: File, kind: BrandImageKind, slug: string): Promise<string> {
  const { cloudinaryCloudName: cloudName, cloudinaryUploadPreset: preset } = publicEnv
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

/**
 * The public URL of the stored image: the unsigned direct upload when it works, else one try
 * through `viaServer`, whose failure is then the error thrown. `kind` picks which URL of the
 * action's result is returned (logoUrl or coverUrl).
 */
export async function uploadBrandImage(
  file: File,
  kind: BrandImageKind,
  slug: string,
  viaServer: BrandUploadAction,
): Promise<string> {
  try {
    return await uploadDirect(file, kind, slug)
  } catch {
    const body = new FormData()
    body.append('file', file)
    const result = await viaServer(body, slug)
    if (!result.success) throw new Error(result.error || 'Upload failed')
    const url = kind === 'logo' ? result.logoUrl : result.coverUrl
    if (!url) throw new Error('Upload returned no URL')
    return url
  }
}
