// components/upload/targets.ts
// Where each kind of upload lands in Cloudinary: the folder under the restaurant and the
// public id. The four upload components each described their own before the copies merged.

export type ArModelType = 'usdz' | 'glb'

export interface CloudinaryTarget {
  /** Folder under the account, e.g. `restaurants/<slug>/branding`. */
  folder: string
  publicId: string
  /** Sent as `resource_type` and used as the upload endpoint; when unset the form omits it and the endpoint is `image`. */
  resourceType?: 'raw' | 'image'
}

/** The restaurant's folder name: spaces to underscores, lower case. */
export const restaurantFolderName = (restaurantName: string) => restaurantName.replace(/\s+/g, '_').toLowerCase()

export const arModelTarget = (restaurantName: string, type: ArModelType): CloudinaryTarget => ({
  folder: `restaurants/${restaurantFolderName(restaurantName)}/ar`,
  publicId: `${type}_${Date.now()}`,
  resourceType: 'raw',
})

export const dishImageTarget = (restaurantName: string): CloudinaryTarget => ({
  folder: `restaurants/${restaurantFolderName(restaurantName)}/dishes`,
  publicId: `dish_${Date.now()}`,
  resourceType: 'image',
})

/** A fixed public id, so a new logo or cover replaces the previous one. */
export const brandImageTarget = (restaurantSlug: string, kind: 'logo' | 'cover'): CloudinaryTarget => ({
  folder: `restaurants/${restaurantSlug}/branding`,
  publicId: kind,
})
