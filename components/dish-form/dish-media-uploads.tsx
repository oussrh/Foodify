// components/dish-form/dish-media-uploads.tsx
// The upload cards under the dish fields: the photo and the AR models, bound to the form's asset
// state; the photo URL is also written into the form's hidden imageUrl field. A saved dish also gets
// "Create from a video" (components/capture/), whose accepted models land in the same state.
'use client'

import ARFileUpload from '@/components/ar-file-upload'
import { DishCapture } from '@/components/capture/dish-capture'
import ImageUpload from '@/components/image-upload'
import type { DishAssets } from './use-dish-assets'

/**
 * The dish's photo and AR model upload cards, bound to the form's asset state; an uploaded photo's
 * URL also goes to the caller so the form's hidden imageUrl field follows it. With `dishId` (a saved
 * dish), the capture card too.
 */
export default function DishMediaUploads({
  restaurantName,
  assets,
  onImageUrl,
  dishId,
  onModelAccepted,
}: {
  restaurantName?: string | undefined
  assets: DishAssets
  onImageUrl: (url: string) => void
  dishId?: string | undefined
  /** A model accepted from a video, already saved on the dish: the form keeps it on Discard. */
  onModelAccepted?: ((glbUrl: string, usdzUrl: string) => void) | undefined
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

      {dishId && (
        <DishCapture
          dishId={dishId}
          onPreview={(url) => assets.handlePreview(url, 'glb')}
          onAccepted={(glbUrl, usdzUrl) => {
            assets.setGlbUrl(glbUrl)
            assets.setUsdzUrl(usdzUrl)
            onModelAccepted?.(glbUrl, usdzUrl)
          }}
        />
      )}

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
