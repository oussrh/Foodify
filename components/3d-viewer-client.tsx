// PathFile: components/3d-viewer-client.tsx
"use client"

import { useEffect, useState, useRef, createElement } from 'react'
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
  Settings,
  Info,
  Monitor
} from 'lucide-react'

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
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [showInfo, setShowInfo] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [modelViewerLoaded, setModelViewerLoaded] = useState(false)
  
  useEffect(() => {
    // Load model-viewer script
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'
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
      
      // Add loading poster
      const poster = document.createElement('div')
      poster.setAttribute('slot', 'poster')
      poster.className = 'absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black'
      poster.innerHTML = `
        <div class="text-center text-white space-y-6">
          <div class="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <svg class="h-8 w-8 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div class="space-y-2">
            <p class="text-lg font-medium">Loading 3D model...</p>
            <p class="text-sm text-gray-400">This may take a moment</p>
          </div>
        </div>
      `
      
      // Add error slot
      const errorSlot = document.createElement('div')
      errorSlot.setAttribute('slot', 'error')
      errorSlot.className = 'absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black'
      errorSlot.innerHTML = `
        <div class="text-center text-white space-y-4">
          <svg class="h-16 w-16 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div class="space-y-2">
            <h2 class="text-xl font-bold">Failed to load model</h2>
            <p class="text-gray-400">Please check the model URL and try again</p>
          </div>
        </div>
      `
      
      modelViewer.appendChild(poster)
      modelViewer.appendChild(errorSlot)
      
      // Clear container and add model viewer
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(modelViewer)
      
      modelViewerRef.current = modelViewer as ModelViewer
    }
  }, [modelViewerLoaded, modelUrl, dishName, isAutoRotating])

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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="w-20 h-20 bg-destructive/20 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground">No Model Specified</h1>
            <p className="text-muted-foreground max-w-md">Please provide a valid 3D model URL to view the interactive model.</p>
          </div>
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground">Loading 3D Viewer</h1>
            <p className="text-muted-foreground">Preparing {dishName} in immersive 3D...</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="w-20 h-20 bg-destructive/20 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground">Error Loading 3D Model</h1>
            <p className="text-muted-foreground max-w-md">{error}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button 
              onClick={() => window.close()} 
              variant="outline"
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
    <div className="min-h-screen relative bg-gradient-to-br from-background to-muted overflow-hidden">
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-20 transition-all duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="bg-background/90 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between p-6">
            <Button 
              onClick={() => window.close()} 
              variant="ghost" 
              className="h-10 px-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="text-center">
              <h1 className="text-foreground font-bold text-xl">{dishName}</h1>
              <p className="text-muted-foreground text-sm flex items-center gap-2 justify-center mt-1">
                <Monitor className="h-3 w-3" />
                Interactive 3D Preview
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowControls(!showControls)}
                variant="ghost" 
                size="icon"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                onClick={toggleFullscreen}
                variant="ghost" 
                size="icon"
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
        <div 
          ref={containerRef}
          className="w-full h-full"
          style={{ backgroundColor: 'transparent' }}
        />

        {/* Gradient overlays for better contrast */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/20 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
      </div>

      {/* Controls Panel */}
      <div className={`absolute bottom-8 right-8 transition-all duration-300 ${showControls ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        <div className="bg-card/90 backdrop-blur-xl rounded-2xl p-6 space-y-6 border border-border shadow-2xl min-w-[280px]">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Controls
            </h3>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
              Interactive
            </Badge>
          </div>
          
          {/* Primary Controls */}
          <div className="space-y-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start h-10"
              onClick={resetView}
            >
              <RotateCcw className="h-4 w-4 mr-3" />
              Reset View
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start h-10"
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
              className="w-full justify-start h-10"
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info className="h-4 w-4 mr-3" />
              {showInfo ? 'Hide Info' : 'Show Info'}
            </Button>
          </div>
          
          {/* Instructions */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="text-foreground font-medium text-sm">How to Navigate</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center">
                  <Move3D className="h-3 w-3" />
                </div>
                <span>Click & drag horizontally to rotate</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center">
                  <ZoomIn className="h-3 w-3" />
                </div>
                <span>Scroll or pinch to zoom</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center">
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
        <div className="bg-card/90 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl max-w-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <Monitor className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold">{dishName}</h3>
              <p className="text-muted-foreground text-sm">3D Model Viewer</p>
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Quality</span>
              <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 text-xs">
                High Definition
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Lighting</span>
              <span className="text-foreground text-xs">Realistic Shadows</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Interaction</span>
              <span className="text-foreground text-xs">Horizontal Rotation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Controls Button (when hidden) */}
      {!showControls && (
        <Button
          onClick={() => setShowControls(true)}
          className="absolute top-1/2 right-4 -translate-y-1/2 bg-card/90 backdrop-blur-xl border border-border hover:bg-accent rounded-full w-12 h-12 p-0"
          size="icon"
        >
          <Settings className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}
