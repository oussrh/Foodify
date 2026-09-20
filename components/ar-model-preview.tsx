// PathFile: components/ar-model-preview.tsx
"use client"

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MODEL_VIEWER_SCRIPT_SRC, type ModelViewer } from '@/components/model-viewer/element'
import { useAutoRotate } from '@/components/model-viewer/use-auto-rotate'
import { PreviewFooter, PreviewHeader } from '@/components/ar-preview/preview-chrome'
import { UsdzPane } from '@/components/ar-preview/usdz-pane'
import { GlbPane } from '@/components/ar-preview/glb-pane'

interface ARModelPreviewProps {
  isOpen: boolean
  onClose: () => void
  modelUrl: string
  modelType: 'usdz' | 'glb'
  dishName?: string
}

const isModelViewerDefined = () => typeof customElements !== 'undefined' && Boolean(customElements.get('model-viewer'))
const subscribeModelViewer = (onChange: () => void) => {
  customElements.whenDefined('model-viewer').then(onChange, () => {})
  return () => {}
}

export default function ARModelPreview({
  isOpen,
  onClose,
  modelUrl,
  modelType,
  dishName = 'Dish Preview'
}: ARModelPreviewProps) {
  const [error, setError] = useState<string | null>(null)
  const modelViewerLoaded = useSyncExternalStore(subscribeModelViewer, isModelViewerDefined, () => false)
  const isLoading = !error && (modelType === 'glb' ? !modelViewerLoaded : !isOpen)
  const containerRef = useRef<HTMLDivElement>(null)
  const modelViewerRef = useRef<ModelViewer | null>(null)
  const { isAutoRotating, toggleAutoRotate, resetView } = useAutoRotate(modelViewerRef)

  // The viewer script is injected once; the registry (above) says when the element exists.
  useEffect(() => {
    if (!isOpen || modelType !== 'glb' || isModelViewerDefined()) return
    if (document.querySelector('script[src*="model-viewer"]')) return
    const script = document.createElement('script')
    script.type = 'module'
    script.src = MODEL_VIEWER_SCRIPT_SRC
    script.onerror = () => setError('Failed to load 3D viewer')
    document.head.appendChild(script)
  }, [isOpen, modelType])

  // Create the model-viewer element programmatically
  useEffect(() => {
    if (modelViewerLoaded && containerRef.current && modelUrl && modelType === 'glb') {
      const modelViewer = document.createElement('model-viewer')

      // Set attributes
      modelViewer.setAttribute('src', modelUrl)
      modelViewer.setAttribute('alt', `3D model of ${dishName}`)
      modelViewer.setAttribute('camera-controls', '')
      modelViewer.setAttribute('touch-action', 'pan-y')
      if (isAutoRotating) {
        modelViewer.setAttribute('auto-rotate', '')
      }
      modelViewer.setAttribute('auto-rotate-delay', '1000')
      modelViewer.setAttribute('rotation-per-second', '20deg')
      modelViewer.setAttribute('environment-image', 'neutral')
      modelViewer.setAttribute('shadow-intensity', '1')
      modelViewer.setAttribute('exposure', '1')
      modelViewer.setAttribute('loading', 'eager')
      modelViewer.setAttribute('reveal', 'auto')

      // Set styles
      modelViewer.style.width = '100%'
      modelViewer.style.height = '100%'
      modelViewer.style.backgroundColor = 'transparent'

      // Add event listeners
      modelViewer.addEventListener('load', () => {
        console.log('Model loaded successfully:', modelUrl)
      })

      modelViewer.addEventListener('error', (e) => {
        console.error('Model failed to load:', e, modelUrl)
        setError('Failed to load 3D model')
      })

      // Add loading poster
      const poster = document.createElement('div')
      poster.setAttribute('slot', 'poster')
      poster.className = 'absolute inset-0 flex items-center justify-center bg-muted'
      poster.innerHTML = `
        <div class="text-center space-y-4">
          <div class="w-12 h-12 mx-auto">
            <svg class="animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p class="text-muted-foreground text-sm">Loading 3D model...</p>
        </div>
      `

      modelViewer.appendChild(poster)

      // Clear container and add model viewer
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(modelViewer)

      modelViewerRef.current = modelViewer as ModelViewer
    }
  }, [modelViewerLoaded, modelUrl, dishName, isAutoRotating, modelType])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = modelUrl
    link.download = `${dishName.replace(/\s+/g, '_')}.${modelType}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openFullScreen = () => {
    window.open(
      `/3d-viewer?model=${encodeURIComponent(modelUrl)}&name=${encodeURIComponent(dishName)}`,
      '_blank',
      'width=1200,height=800'
    )
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 bg-card border-border">
        <PreviewHeader dishName={dishName} modelType={modelType} onClose={onClose} />

        <div className="flex-1 relative overflow-hidden">
          {modelType === 'usdz' ? (
            <UsdzPane onDownload={handleDownload} />
          ) : (
            <GlbPane
              isLoading={isLoading}
              error={error}
              containerRef={containerRef}
              isAutoRotating={isAutoRotating}
              onReset={resetView}
              onToggleAutoRotate={toggleAutoRotate}
              onDownload={handleDownload}
              onFullScreen={openFullScreen}
            />
          )}
        </div>

        <PreviewFooter modelType={modelType} />
      </DialogContent>
    </Dialog>
  )
}
