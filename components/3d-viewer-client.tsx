// PathFile: components/3d-viewer-client.tsx
"use client"

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Pause,
  Camera,
  Settings,
  Info,
  Download,
  Share2,
  Monitor
} from 'lucide-react'

// Declare the model-viewer element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

// Define ModelViewer interface for better type safety
interface ModelViewer extends HTMLElement {
  resetTurntableRotation(): void;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

export default function ThreeDViewerClient() {
  const searchParams = useSearchParams()
  const modelUrl = searchParams.get('model')
  const dishName = searchParams.get('name') || 'Dish'
  const modelViewerRef = useRef<ModelViewer | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [showInfo, setShowInfo] = useState(true)
  const [showControls, setShowControls] = useState(true)
  
  useEffect(() => {
    // Load model-viewer script
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'
    script.onload = () => {
      setIsLoading(false)
      // Store reference to model-viewer element
      setTimeout(() => {
        modelViewerRef.current = document.querySelector('model-viewer') as ModelViewer
      }, 100)
    }
    script.onerror = () => {
      setError('Failed to load 3D viewer')
      setIsLoading(false)
    }
    document.head.appendChild(script)
    
    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

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

  if (!modelUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center text-white">
        <div className="text-center space-y-6 p-8">
          <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">No Model Specified</h1>
            <p className="text-gray-400 max-w-md">Please provide a valid 3D model URL to view the interactive model.</p>
          </div>
          <Button onClick={() => window.close()} variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center text-white">
        <div className="text-center space-y-6 p-8">
          <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">Loading 3D Viewer</h1>
            <p className="text-gray-400">Preparing {dishName} in immersive 3D...</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center text-white">
        <div className="text-center space-y-6 p-8">
          <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">Error Loading 3D Model</h1>
            <p className="text-gray-400 max-w-md">{error}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button 
              onClick={() => window.close()} 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-20 transition-all duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between p-6">
            <Button 
              onClick={() => window.close()} 
              variant="ghost" 
              className="text-white hover:bg-white/20 h-10 px-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="text-center">
              <h1 className="text-white font-bold text-xl">{dishName}</h1>
              <p className="text-white/60 text-sm flex items-center gap-2 justify-center mt-1">
                <Monitor className="h-3 w-3" />
                Interactive 3D Preview
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowControls(!showControls)}
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                onClick={toggleFullscreen}
                variant="ghost" 
                size="icon"
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
        </div>
      </div>

      {/* 3D Model Viewer */}
      <div className="h-screen w-full relative">
        <model-viewer
          src={modelUrl}
          alt={`Interactive 3D model of ${dishName}`}
          camera-controls
          touch-action="pan-y"
          auto-rotate={isAutoRotating}
          auto-rotate-delay="1000"
          rotation-per-second="15deg"
          environment-image="neutral"
          shadow-intensity="1.2"
          exposure="1.2"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent'
          }}
          loading="eager"
          reveal="auto"
          tone-mapping="aces"
          camera-orbit="0deg 75deg 2.5m"
          min-camera-orbit="auto auto 1m"
          max-camera-orbit="auto auto 10m"
          interpolation-decay="200"
        >
          {/* Loading indicator */}
          <div slot="poster" className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center text-white space-y-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium">Loading 3D model...</p>
                <p className="text-sm text-gray-400">This may take a moment</p>
              </div>
            </div>
          </div>

          {/* Error state */}
          <div slot="error" className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center text-white space-y-4">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto" />
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Failed to load model</h2>
                <p className="text-gray-400">Please check the model URL and try again</p>
              </div>
            </div>
          </div>
        </model-viewer>

        {/* Gradient overlays for better contrast */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Controls Panel */}
      <div className={`absolute bottom-8 right-8 transition-all duration-300 ${showControls ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-6 space-y-6 border border-white/10 shadow-2xl min-w-[280px]">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Controls
            </h3>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
              Interactive
            </Badge>
          </div>
          
          {/* Primary Controls */}
          <div className="space-y-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 w-full justify-start h-10"
              onClick={resetView}
            >
              <RotateCcw className="h-4 w-4 mr-3" />
              Reset View
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 w-full justify-start h-10"
              onClick={toggleAutoRotate}
            >
              {isAutoRotating ? (
                <>
                  <Pause className="h-4 w-4 mr-3" />
                  Stop Rotation
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-3" />
                  Auto Rotate
                </>
              )}
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 w-full justify-start h-10"
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info className="h-4 w-4 mr-3" />
              {showInfo ? 'Hide Info' : 'Show Info'}
            </Button>
          </div>
          
          {/* Instructions */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h4 className="text-white/90 font-medium text-sm">How to Navigate</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3 text-white/60 hover:text-white/80 transition-colors">
                <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                  <Move3D className="h-3 w-3" />
                </div>
                <span>Click & drag to rotate</span>
              </div>
              <div className="flex items-center gap-3 text-white/60 hover:text-white/80 transition-colors">
                <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                  <ZoomIn className="h-3 w-3" />
                </div>
                <span>Scroll or pinch to zoom</span>
              </div>
              <div className="flex items-center gap-3 text-white/60 hover:text-white/80 transition-colors">
                <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                  <Eye className="h-3 w-3" />
                </div>
                <span>Right-click & drag to pan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Info */}
      <div className={`absolute bottom-8 left-8 transition-all duration-300 ${showInfo && showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl max-w-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{dishName}</h3>
              <p className="text-white/60 text-sm">3D Model Viewer</p>
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Quality</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                High Definition
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Lighting</span>
              <span className="text-white/90 text-xs">Realistic Shadows</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-white/60">Interaction</span>
              <span className="text-white/90 text-xs">360° Viewing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Controls Button (when hidden) */}
      {!showControls && (
        <Button
          onClick={() => setShowControls(true)}
          className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/80 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 rounded-full w-12 h-12 p-0"
          size="icon"
        >
          <Settings className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}
