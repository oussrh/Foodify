"use client"

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Move3D,
  Camera,
  AlertCircle,
  Loader2
} from 'lucide-react'

export default function ARViewerClient() {
  const searchParams = useSearchParams()
  const modelUrl = searchParams.get('model')
  const dishName = searchParams.get('name') || 'Dish'
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isARSupported, setIsARSupported] = useState(false)
  
  useEffect(() => {
    // Check for WebXR support
    if ('xr' in navigator) {
      // @ts-ignore
      navigator.xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
        setIsARSupported(supported)
      }).catch(() => {
        setIsARSupported(false)
      })
    }
    
    // Load model-viewer script
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'
    script.onload = () => setIsLoading(false)
    script.onerror = () => {
      setError('Failed to load AR viewer')
      setIsLoading(false)
    }
    document.head.appendChild(script)
    
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  if (!modelUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
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
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto" />
          <h1 className="text-2xl font-bold">Loading AR Experience</h1>
          <p className="text-gray-400">Preparing {dishName} in 3D...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Error Loading AR</h1>
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
    <div className="min-h-screen bg-black relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between">
          <Button 
            onClick={() => window.close()} 
            variant="ghost" 
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-white font-bold text-lg">{dishName}</h1>
          <div className="w-16"></div> {/* Spacer for center alignment */}
        </div>
      </div>

      {/* 3D Model Viewer */}
      <div className="h-screen w-full">
        {/* @ts-ignore */}
        <model-viewer
          src={modelUrl}
          alt={`3D model of ${dishName}`}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          touch-action="pan-y"
          auto-rotate
          auto-rotate-delay="3000"
          rotation-per-second="30deg"
          environment-image="neutral"
          shadow-intensity="1"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent'
          }}
          loading="eager"
          reveal="auto"
        >
          {/* AR Button */}
          <button 
            slot="ar-button" 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full shadow-lg font-medium flex items-center gap-2 transition-all"
          >
            <Camera className="h-5 w-5" />
            View in AR
          </button>
          
          {/* Loading indicator */}
          <div slot="poster" className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto" />
              <p>Loading 3D model...</p>
            </div>
          </div>
        </model-viewer>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-8 right-8 space-y-2">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 space-y-2">
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
          
          <div className="text-white text-xs space-y-1 px-2">
            <p className="flex items-center gap-1">
              <Move3D className="h-3 w-3" />
              Drag to rotate
            </p>
            <p className="flex items-center gap-1">
              <ZoomIn className="h-3 w-3" />
              Pinch to zoom
            </p>
          </div>
        </div>
      </div>

      {/* AR Not Supported Message */}
      {!isARSupported && (
        <div className="absolute bottom-20 left-4 right-4">
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3 text-amber-100">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-medium">AR not available</p>
                <p className="text-sm text-amber-200">
                  Your device doesn't support AR, but you can still explore the 3D model by dragging and pinching.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}