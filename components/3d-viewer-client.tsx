"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Move3D,
  Eye,
  AlertCircle,
  Loader2,
  Maximize,
  Minimize,
  Play,
  Pause
} from 'lucide-react'

export default function ThreeDViewerClient() {
  const searchParams = useSearchParams()
  const modelUrl = searchParams.get('model')
  const dishName = searchParams.get('name') || 'Dish'
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  
  useEffect(() => {
    // Load model-viewer script
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'
    script.onload = () => setIsLoading(false)
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

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const toggleAutoRotate = () => {
    const modelViewer = document.querySelector('model-viewer')
    if (modelViewer) {
      if (isAutoRotating) {
        // @ts-ignore
        modelViewer.removeAttribute('auto-rotate')
      } else {
        // @ts-ignore
        modelViewer.setAttribute('auto-rotate', '')
      }
      setIsAutoRotating(!isAutoRotating)
    }
  }

  if (!modelUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">No Model Specified</h1>
          <p className="text-gray-400">Please provide a valid 3D model URL</p>
          <Button onClick={() => window.close()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <h1 className="text-2xl font-bold">Loading 3D Viewer</h1>
          <p className="text-gray-400">Preparing {dishName} in 3D...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Error Loading 3D Model</h1>
          <p className="text-gray-400">{error}</p>
          <Button onClick={() => window.close()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <Button 
            onClick={() => window.close()} 
            variant="ghost" 
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-white font-bold text-lg">{dishName}</h1>
            <p className="text-white/70 text-sm">3D Preview</p>
          </div>
          <Button 
            onClick={toggleFullscreen}
            variant="ghost" 
            className="text-white hover:bg-white/20"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 3D Model Viewer */}
      <div className="h-screen w-full">
        {/* @ts-ignore */}
        <model-viewer
          src={modelUrl}
          alt={`3D model of ${dishName}`}
          camera-controls
          touch-action="pan-y"
          auto-rotate={isAutoRotating}
          auto-rotate-delay="1000"
          rotation-per-second="20deg"
          environment-image="neutral"
          shadow-intensity="1"
          exposure="1"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent'
          }}
          loading="eager"
          reveal="auto"
          tone-mapping="aces"
        >
          {/* Loading indicator */}
          <div slot="poster" className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center text-white space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
              <p>Loading 3D model...</p>
            </div>
          </div>
        </model-viewer>
      </div>

      {/* Controls Panel */}
      <div className="absolute bottom-8 right-8 space-y-2">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 space-y-3 border border-white/10">
          <h3 className="text-white font-medium text-sm">Controls</h3>
          
          {/* Primary Controls */}
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 w-full justify-start"
              onClick={() => {
                const modelViewer = document.querySelector('model-viewer')
                if (modelViewer) {
                  // @ts-ignore
                  modelViewer.resetTurntableRotation()
                }
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset View
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 w-full justify-start"
              onClick={toggleAutoRotate}
            >
              {isAutoRotating ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Rotation
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Auto Rotate
                </>
              )}
            </Button>
          </div>
          
          {/* Instructions */}
          <div className="text-white text-xs space-y-1 pt-2 border-t border-white/10">
            <p className="flex items-center gap-1 text-white/70">
              <Move3D className="h-3 w-3" />
              Click & drag to rotate
            </p>
            <p className="flex items-center gap-1 text-white/70">
              <ZoomIn className="h-3 w-3" />
              Scroll to zoom
            </p>
            <p className="flex items-center gap-1 text-white/70">
              <Eye className="h-3 w-3" />
              Right-click & drag to pan
            </p>
          </div>
        </div>
      </div>

      {/* Model Info */}
      <div className="absolute bottom-8 left-8">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-white/10 max-w-xs">
          <h3 className="text-white font-medium mb-2">{dishName}</h3>
          <div className="space-y-1 text-sm text-white/70">
            <p>High-quality 3D model</p>
            <p>Interactive viewing experience</p>
            <p>Realistic lighting and shadows</p>
          </div>
        </div>
      </div>
    </div>
  )
}