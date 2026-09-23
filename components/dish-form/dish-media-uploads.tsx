// components/dish-form/dish-media-uploads.tsx
// The two upload cards under the dish fields: the photo and the AR models, bound to the
// form's asset state; the photo URL is also written into the form's hidden imageUrl field.
'use client'

import ARFileUpload from '@/components/ar-file-upload'
import ImageUpload from '@/components/image-upload'
import type { DishAssets } from './use-dish-assets'

/**
 * The dish's photo and AR model upload cards, bound to the form's asset state; an uploaded photo's
 * URL also goes to the caller so the form's hidden imageUrl field follows it.
 */
export default function DishMediaUploads({
  restaurantName,
  assets,
  onImageUrl,
}: {
  restaurantName?: string | undefined
  assets: DishAssets
  onImageUrl: (url: string) => void
}) {
  return (
    <>
      {/* Dish Image Upload */}
      <ImageUpload
        restaurantName={restaurantName || 'Restaurant'}
        currentImageUrl={assets.imageUrl}
        onImageUpload={(url) => {
          assets.setImageUrl(url)
          onImageUrl(url)
        }}
      />

      {/* AR Models Upload */}
      <ARFileUpload
        restaurantName={restaurantName || 'Restaurant'}
        currentUsdzUrl={assets.usdzUrl}
        currentGlbUrl={assets.glbUrl}
        onUsdzUpload={assets.setUsdzUrl}
        onGlbUpload={assets.setGlbUrl}
        onPreview={assets.handlePreview}
      />
    </>
  )
}
