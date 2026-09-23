// components/dish-form/use-dish-assets.ts
// The dish's media as the form holds it beside the fields: the image, USDZ and GLB URLs the
// uploads set, and the model the guest asked to preview.
import { useCallback, useState } from 'react'

/** The URLs a form starts from; an unset one is absent or `undefined`, and reads as ''. */
export type DishAssetUrls = { imageUrl?: string | undefined; usdzUrl?: string | undefined; glbUrl?: string | undefined }
export type PreviewModel = { url: string; type: 'usdz' | 'glb' }

/**
 * Holds a dish form's image, USDZ and GLB URLs beside its fields, plus the model open for preview.
 * The upload components set them; resetAssets restores given URLs but leaves the preview alone.
 */
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
