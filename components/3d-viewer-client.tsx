// PathFile: components/3d-viewer-client.tsx
"use client"

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { MODEL_VIEWER_SCRIPT_SRC, type ModelViewer } from '@/components/model-viewer/element'
import { useAutoRotate } from '@/components/model-viewer/use-auto-rotate'
import { useFullscreen } from '@/components/use-fullscreen'
import { createErrorSlot, createPoster } from '@/components/3d-viewer/slots'
import { ErrorScreen, LoadingScreen, NoModelScreen } from '@/components/3d-viewer/screens'
import { ControlsPanel, ModelInfoPanel, ShowControlsButton, ViewerHeader } from '@/components/3d-viewer/viewer-panels'

export default function ThreeDViewerClient() {
  const searchParams = useSearchParams()
  const modelUrl = searchParams.get('model')
  const dishName = searchParams.get('name') || 'Dish'
  const modelViewerRef = useRef<ModelViewer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isFullscreen, toggleFullscreen } = useFullscreen()
  const { isAutoRotating, toggleAutoRotate, resetView } = useAutoRotate(modelViewerRef)
  const [showInfo, setShowInfo] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [modelViewerLoaded, setModelViewerLoaded] = useState(false)

  useEffect(() => {
    // Load model-viewer script
    const script = document.createElement('script')
    script.type = 'module'
    script.src = MODEL_VIEWER_SCRIPT_SRC
    script.onload = () => {
      setIsLoading(false)
      setModelViewerLoaded(true)
      // Store reference to model-viewer element
      setTimeout(() => {
        modelViewerRef.current = document.querySelector('model-viewer') as ModelViewer
      }, 500)
    }
    script.onerror = () => {
      setError('Failed to load 3D viewer')
      setIsLoading(false)
    }
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // Create the model-viewer element programmatically
  useEffect(() => {
    if (modelViewerLoaded && containerRef.current && modelUrl) {
      const modelViewer = document.createElement('model-viewer')

      // Set attributes
      modelViewer.setAttribute('src', modelUrl)
      modelViewer.setAttribute('alt', `Interactive 3D model of ${dishName}`)
      modelViewer.setAttribute('camera-controls', '')
      modelViewer.setAttribute('touch-action', 'pan-y')
      if (isAutoRotating) {
        modelViewer.setAttribute('auto-rotate', '')
      }
      modelViewer.setAttribute('auto-rotate-delay', '1000')
      modelViewer.setAttribute('rotation-per-second', '15deg')
      modelViewer.setAttribute('environment-image', 'neutral')
      modelViewer.setAttribute('shadow-intensity', '1.2')
      modelViewer.setAttribute('exposure', '1.2')
      modelViewer.setAttribute('loading', 'eager')
      modelViewer.setAttribute('reveal', 'auto')
      modelViewer.setAttribute('tone-mapping', 'aces')
      modelViewer.setAttribute('camera-orbit', '0deg 90deg 2.5m')
      modelViewer.setAttribute('min-camera-orbit', 'auto 90deg 1m')
      modelViewer.setAttribute('max-camera-orbit', 'auto 90deg 10m')
      modelViewer.setAttribute('interpolation-decay', '200')

      // Set styles
      modelViewer.style.width = '100%'
      modelViewer.style.height = '100%'
      modelViewer.style.backgroundColor = 'transparent'

      modelViewer.appendChild(createPoster())
      modelViewer.appendChild(createErrorSlot())

      // Clear container and add model viewer
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(modelViewer)

      modelViewerRef.current = modelViewer as ModelViewer
    }
  }, [modelViewerLoaded, modelUrl, dishName, isAutoRotating])

  if (!modelUrl) {
    return <NoModelScreen />
  }

  if (isLoading) {
    return <LoadingScreen dishName={dishName} />
  }

  if (error) {
    return <ErrorScreen error={error} />
  }

  return (
    <div className="min-h-screen relative bg-linear-to-br from-background to-muted overflow-hidden">
      <ViewerHeader
        dishName={dishName}
        showControls={showControls}
        isFullscreen={isFullscreen}
        onToggleControls={() => setShowControls(!showControls)}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* 3D Model Viewer */}
      <div className="h-screen w-full relative">
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ backgroundColor: 'transparent' }}
        />

        {/* Gradient overlays for better contrast */}
        <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-background/20 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background/20 to-transparent pointer-events-none" />
      </div>

      <ControlsPanel
        showControls={showControls}
        isAutoRotating={isAutoRotating}
        showInfo={showInfo}
        onReset={resetView}
        onToggleAutoRotate={toggleAutoRotate}
        onToggleInfo={() => setShowInfo(!showInfo)}
      />

      <ModelInfoPanel dishName={dishName} visible={showInfo && showControls} />

      {!showControls && <ShowControlsButton onClick={() => setShowControls(true)} />}
    </div>
  )
}
