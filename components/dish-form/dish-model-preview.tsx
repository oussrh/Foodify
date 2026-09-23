// components/dish-form/dish-model-preview.tsx
// The AR model preview dialog under a dish form, open while the assets hold a model to show;
// titled with the dish's English name as typed so far.
'use client'

import ARModelPreview from '@/components/ar-model-preview'
import type { DishAssets } from './use-dish-assets'

/**
 * The AR model preview dialog under a dish form, titled with the English name typed so far. It
 * renders only while the assets hold a model to preview; closing it clears that model.
 */
export default function DishModelPreview({ assets, dishName }: { assets: DishAssets; dishName?: string }) {
  const { previewModel, setPreviewModel } = assets
  if (!previewModel) return null
  return (
    <ARModelPreview
      isOpen={!!previewModel}
      onClose={() => setPreviewModel(null)}
      modelUrl={previewModel.url}
      modelType={previewModel.type}
      dishName={dishName || 'Dish Preview'}
    />
  )
}
