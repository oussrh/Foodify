// components/upload/browser-upload.ts  (client-side)
// The unsigned Cloudinary upload the four upload components (AR models, dish images, the
// restaurant logo and cover) make straight from the browser: one implementation behind a
// target (targets.ts) that says where the file goes. The cloud name and preset are read
// through lib/env (the one module that reads the environment). Every message thrown here is
// the one each component threw before the copies were merged.
import { publicEnv } from '@/lib/env'
import type { CloudinaryTarget } from '@/components/upload/targets'

/** What Cloudinary answers; `width`, `height` and `bytes` come back for images only. */
export interface UploadResult {
  secure_url: string
  public_id: string
  resource_type: string
  format: string
  width?: number
  height?: number
  bytes?: number
}

/** True when both public variables are set, so the browser can upload without the server. */
export const isBrowserUploadConfigured = () => Boolean(publicEnv.cloudinaryCloudName && publicEnv.cloudinaryUploadPreset)

/**
 * Uploads a file straight from the browser to Cloudinary, unsigned, into the folder and public id
 * the target names. Throws when the cloud name or preset is unset, or when Cloudinary refuses the
 * file.
 */
export async function uploadToCloudinary(file: File, target: CloudinaryTarget): Promise<UploadResult> {
  const { cloudinaryCloudName: cloudName, cloudinaryUploadPreset: uploadPreset } = publicEnv

  if (!cloudName) {
    throw new Error('Cloudinary cloud name is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your environment variables.')
  }

  if (!uploadPreset) {
    throw new Error('Cloudinary upload preset is not configured. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your environment variables.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', target.folder)
  if (target.resourceType) formData.append('resource_type', target.resourceType)
  formData.append('public_id', target.publicId)

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${target.resourceType ?? 'image'}/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Cloudinary upload error:', errorData)
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    if (result.error) {
      throw new Error(`Cloudinary error: ${result.error.message}`)
    }

    return result
  } catch (error) {
    console.error('Upload error details:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Network error occurred during upload')
  }
}

/** The route through the server when the browser upload fails: the action keeps the Cloudinary secret. */
export interface ServerFallback {
  /** `uploadRestaurantLogo` / `uploadRestaurantCover` from app/actions/restaurant-actions. */
  action: (formData: FormData, slug: string) => Promise<{ success: boolean; error?: string; logoUrl?: string; coverUrl?: string }>
  slug: string
  /** The key of the action's answer that carries the URL. */
  urlKey: 'logoUrl' | 'coverUrl'
}

/**
 * The browser upload first, then the same file through the server action when it fails. Resolves
 * with the URL (undefined when the server answered success without one, as the original did).
 */
export async function uploadWithServerFallback(file: File, target: CloudinaryTarget, fallback: ServerFallback): Promise<string | undefined> {
  try {
    const result = await uploadToCloudinary(file, target)
    return result.secure_url
  } catch (clientError) {
    console.warn('Client-side upload failed, trying server-side upload:', clientError)

    const formData = new FormData()
    formData.append('file', file)

    const serverResult = await fallback.action(formData, fallback.slug)

    if (!serverResult.success) {
      throw new Error(serverResult.error || 'Server-side upload failed')
    }

    return serverResult[fallback.urlKey]
  }
}
