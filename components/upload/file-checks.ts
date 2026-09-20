// components/upload/file-checks.ts
// What each upload accepts, checked before a byte leaves the browser: the extension or MIME
// type, a double extension on branding images, and the size limit of the kind. A check answers
// with the message the component shows, or null when the file passes.
import type { ArModelType } from '@/components/upload/targets'

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/** A USDZ or GLB model by its extension, up to 50MB. */
export function validateArModel(file: File, type: ArModelType): string | null {
  const expectedExtension = type === 'usdz' ? '.usdz' : '.glb'
  if (!file.name.toLowerCase().endsWith(expectedExtension)) {
    return `Please select a ${expectedExtension} file`
  }
  if (file.size > 50 * 1024 * 1024) {
    return `File size must be less than 50MB. Current size: ${formatFileSize(file.size)}`
  }
  return null
}

const DISH_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** A dish photo: JPG, PNG, WebP or GIF, up to 10MB. */
export function validateDishImage(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Please select an image file (JPG, PNG, WebP, or GIF)'
  }
  if (!DISH_IMAGE_TYPES.includes(file.type)) {
    return 'Unsupported image format. Please use JPG, PNG, WebP, or GIF'
  }
  if (file.size > 10 * 1024 * 1024) {
    return `Image size must be less than 10MB. Current size: ${formatFileSize(file.size)}`
  }
  return null
}

const BRAND_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']

/** A logo or cover: JPG, PNG, WebP or SVG, no double extension, up to `maxMb` (5 for a logo, 10 for a cover). */
export function validateBrandImage(file: File, maxMb: number): string | null {
  if (!BRAND_IMAGE_TYPES.includes(file.type)) {
    return 'Please select a valid image file (JPG, PNG, WebP, or SVG)'
  }
  if (file.name.match(/\.(svg|png|jpg|jpeg|webp)\.(png|jpg|jpeg|webp)$/i)) {
    return 'File appears to have a double extension. Please rename the file and try again.'
  }
  if (file.size > maxMb * 1024 * 1024) {
    return `File size must be less than ${maxMb}MB. Current size: ${formatFileSize(file.size)}`
  }
  return null
}
