"use client"

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import type { ModelViewer, ViewMode } from '@/components/model-viewer/element'
import { useArSupport } from '@/components/ar-viewer/use-ar-support'
import { useModelViewerScript } from '@/components/ar-viewer/use-model-viewer-script'
import { useAutoHideControls } from '@/components/ar-viewer/use-auto-hide-controls'
import { useFullscreen } from '@/components/use-fullscreen'
import { apply3dAttributes, applyArAttributes, applyBaseAttributes } from '@/components/ar-viewer/model-viewer-attributes'
import { attachArEvents, createArButton } from '@/components/ar-viewer/ar-launch'
import { createPoster } from '@/components/ar-viewer/poster'
import { resetCamera, shareViewer, zoomCamera } from '@/components/ar-viewer/camera-controls'
import { ErrorScreen, LoadingScreen, NoModelScreen } from '@/components/ar-viewer/screens'
import { ViewerHeader, ViewModeToggle } from '@/components/ar-viewer/viewer-header'
import { CompactControls, DesktopControls } from '@/components/ar-viewer/viewer-controls'
import { ControlsHint, ModeInfo, ModelLoadedBadge } from '@/components/ar-viewer/viewer-status'

/**
 * The /ar-viewer page: reads `model`, `name` and `mode` from the URL and builds a model-viewer by
 * hand in 3D or AR mode. The element is rebuilt whenever the mode switches.
 */
export default function ARViewerClient() {
  const searchParams = useSearchParams()
  const modelUrl = searchParams.get('model')
  const dishName = searchParams.get('name') || 'Dish'
  const initialMode: ViewMode = searchParams.get('mode') === 'ar' ? 'ar' : '3d'

  const [viewMode, setViewMode] = useState<ViewMode>(initialMode)
  const [modelError, setModelError] = useState<string | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  const { isARSupported, arMode } = useArSupport()
  const { isLoading, scriptError, loadingProgress, modelViewerLoaded } = useModelViewerScript()
  const { showControls, hideControls } = useAutoHideControls(4000)
  const { isFullscreen, toggleFullscreen } = useFullscreen()
  // The script failing and the model failing are exclusive: no element is built without the script.
  const error = scriptError || modelError

  const modelViewerRef = useRef<ModelViewer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Create or update the model-viewer element.
  // Depends on isLoading because the container div is only mounted once the loading screen is gone.
  useEffect(() => {
    if (modelViewerLoaded && !isLoading && containerRef.current && modelUrl) {
      const modelViewer = document.createElement('model-viewer')
      const modeLabel = viewMode === 'ar' ? 'AR' : '3D'

      applyBaseAttributes(modelViewer, modelUrl, dishName)
      if (viewMode === '3d') {
        apply3dAttributes(modelViewer)
      } else if (viewMode === 'ar') {
        applyArAttributes(modelViewer, modelUrl, arMode)
      }

      // Set styles with enhanced background for better 3D visibility
      modelViewer.style.width = '100%'
      modelViewer.style.height = '100%'
      modelViewer.style.backgroundColor = viewMode === 'ar' ? 'transparent' : '#e5e7eb'

      // Add enhanced event listeners for better AR experience
      modelViewer.addEventListener('load', () => {
        setModelLoaded(true)
        console.log(`${modeLabel} model loaded successfully`)
        toast.success(`${modeLabel} model loaded successfully!`)
      })

      modelViewer.addEventListener('error', (event) => {
        console.error('Model loading error:', event)
        setModelError('Failed to load 3D model')
        toast.error('Failed to load 3D model')
      })

      if (viewMode === 'ar') {
        attachArEvents(modelViewer, arMode)
        modelViewer.appendChild(createArButton(arMode))
      }

      modelViewer.appendChild(createPoster(viewMode))

      // Clear container and add model viewer
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(modelViewer)

      modelViewerRef.current = modelViewer as ModelViewer
    }
  }, [modelViewerLoaded, isLoading, modelUrl, dishName, arMode, viewMode])

  // Switch view mode
  const switchViewMode = (mode: ViewMode) => {
    setViewMode(mode)
    setModelLoaded(false)
    toast.success(`Switched to ${mode === 'ar' ? 'AR' : '3D'} mode`)
  }

  const resetView = () => {
    if (modelViewerRef.current) resetCamera(modelViewerRef.current)
  }
  const zoomIn = () => {
    if (modelViewerRef.current) zoomCamera(modelViewerRef.current, 'in')
  }
  const zoomOut = () => {
    if (modelViewerRef.current) zoomCamera(modelViewerRef.current, 'out')
  }
  const shareModel = () => shareViewer(dishName, viewMode)

  if (!modelUrl) {
    return <NoModelScreen />
  }

  if (isLoading) {
    return <LoadingScreen dishName={dishName} loadingProgress={loadingProgress} />
  }

  if (error) {
    return <ErrorScreen error={error} />
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ViewerHeader
        dishName={dishName}
        viewMode={viewMode}
        arMode={arMode}
        showControls={showControls}
        isFullscreen={isFullscreen}
        onShare={shareModel}
        onToggleFullscreen={toggleFullscreen}
      />
      <ViewModeToggle viewMode={viewMode} showControls={showControls} onSwitch={switchViewMode} />

      {/* 3D Model Viewer */}
      <div className="h-screen w-full relative">
        <div
          ref={containerRef}
          className="w-full h-full"
        />
        {modelLoaded && <ModelLoadedBadge viewMode={viewMode} />}
      </div>

      <CompactControls showControls={showControls} onReset={resetView} onZoomIn={zoomIn} onZoomOut={zoomOut} onHide={hideControls} />
      <DesktopControls viewMode={viewMode} showControls={showControls} onReset={resetView} onZoomIn={zoomIn} onZoomOut={zoomOut} onHide={hideControls} />
      <ModeInfo viewMode={viewMode} isARSupported={isARSupported} arMode={arMode} showControls={showControls} />

      {!showControls && <ControlsHint />}
    </div>
  )
}
