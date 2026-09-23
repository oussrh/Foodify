'use client'

// The turntable of a <model-viewer>: on by default, toggled by flipping the auto-rotate
// attribute on the live element, and a reset of its rotation. The 3D page and the preview
// dialog share it.
import { useState, type RefObject } from 'react'
import type { ModelViewer } from '@/components/model-viewer/element'

/**
 * The <model-viewer> turntable: starts on, toggles by flipping the live element's auto-rotate
 * attribute, and resets the rotation; the 3D page and the preview dialog share it.
 */
export function useAutoRotate(modelViewerRef: RefObject<ModelViewer | null>) {
  const [isAutoRotating, setIsAutoRotating] = useState(true)

  const toggleAutoRotate = () => {
    if (modelViewerRef.current) {
      if (isAutoRotating) {
        modelViewerRef.current.removeAttribute('auto-rotate')
      } else {
        modelViewerRef.current.setAttribute('auto-rotate', '')
      }
      setIsAutoRotating(!isAutoRotating)
    }
  }

  const resetView = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.resetTurntableRotation()
    }
  }

  return { isAutoRotating, toggleAutoRotate, resetView }
}
