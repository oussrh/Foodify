// components/dish-form/use-dish-assets.ts
// The dish's media as the form holds it beside the fields: the image, USDZ and GLB URLs the
// uploads set, and the model the guest asked to preview.
import { useCallback, useState } from 'react'

export type DishAssetUrls = { imageUrl?: string; usdzUrl?: string; glbUrl?: string }
export type PreviewModel = { url: string; type: 'usdz' | 'glb' }

export function useDishAssets(initial: DishAssetUrls) {
  const [usdzUrl, setUsdzUrl] = useState(initial.usdzUrl || '')
  const [glbUrl, setGlbUrl] = useState(initial.glbUrl || '')
  const [imageUrl, setImageUrl] = useState(initial.imageUrl || '')
  const [previewModel, setPreviewModel] = useState<PreviewModel | null>(null)

  /** Back to the given URLs (empty ones after a create, the fresh defaults after an edit). */
  const resetAssets = useCallback((next: DishAssetUrls) => {
    setUsdzUrl(next.usdzUrl || '')
    setGlbUrl(next.glbUrl || '')
    setImageUrl(next.imageUrl || '')
  }, [])

  const handlePreview = (modelUrl: string, modelType: 'usdz' | 'glb') => {
    setPreviewModel({ url: modelUrl, type: modelType })
  }

  return {
    usdzUrl,
    setUsdzUrl,
    glbUrl,
    setGlbUrl,
    imageUrl,
    setImageUrl,
    previewModel,
    setPreviewModel,
    handlePreview,
    resetAssets,
  }
}

export type DishAssets = ReturnType<typeof useDishAssets>
