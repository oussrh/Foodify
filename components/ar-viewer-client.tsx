"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  RotateCcw, 
  Camera,
  Eye,
  Monitor,
  Smartphone,
  AlertCircle,
  Loader2,
  Fullscreen,
  Share,
  Settings,
  RefreshCw,
  CheckCircle,
  X,
  Maximize,
  Minimize,
  View,
  Cube,
  ScanLine
} from 'lucide-react'
import { toast } from 'sonner'

// Define ModelViewer interface for better type safety
interface ModelViewer extends HTMLElement {
  resetTurntableRotation(): void;
  jumpCameraToGoal(): void;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

type ViewMode = '3d' | 'ar'

export default function ARViewerClient() {
  const searchParams = useSearchParams()
  const modelUrl = searchParams.get('model')
  const dishName = searchParams.get('name') || 'Dish'
  
  const [viewMode, setViewMode] = useState<ViewMode>('3d')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isARSupported, setIsARSupported] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [modelViewerLoaded, setModelViewerLoaded] = useState(false)
  const [arMode, setArMode] = useState<'webxr' | 'scene-viewer' | 'quick-look' | null>(null)
  
  const modelViewerRef = useRef<ModelViewer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-hide controls after inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 4000)
  }, [])

  useEffect(() => {
    // Check for WebXR support
    if ('xr' in navigator) {
      // @ts-ignore
      navigator.xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
        setIsARSupported(supported)
        if (supported) {
          setArMode('webxr')
        } else if (/iPhone|iPad/.test(navigator.userAgent)) {
          setArMode('quick-look')
        } else if (/Android/.test(navigator.userAgent)) {
          setArMode('scene-viewer')
        }
      }).catch(() => {
        setIsARSupported(false)
        // Fallback detection
        if (/iPhone|iPad/.test(navigator.userAgent)) {
          setArMode('quick-look')
        } else if (/Android/.test(navigator.userAgent)) {
          setArMode('scene-viewer')
        }
      })
    } else {
      // Fallback for browsers without WebXR
      if (/iPhone|iPad/.test(navigator.userAgent)) {
        setArMode('quick-look')
      } else if (/Android/.test(navigator.userAgent)) {
        setArMode('scene-viewer')
      }
    }
    
    // Load model-viewer script
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'
    
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = prev + Math.random() * 15
        return newProgress > 90 ? 90 : newProgress
      })
    }, 200)

    script.onload = () => {
      clearInterval(progressInterval)
      setLoadingProgress(100)
      setModelViewerLoaded(true)
      setTimeout(() => {
        setIsLoading(false)
      }, 300)
    }
    
    script.onerror = () => {
      clearInterval(progressInterval)
      setError('Failed to load AR viewer. Please check your internet connection.')
      setIsLoading(false)
    }
    
    document.head.appendChild(script)
    
    // Mouse movement listener for auto-hide controls
    const handleMouseMove = () => resetControlsTimer()
    const handleTouchStart = () => resetControlsTimer()
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('touchstart', handleTouchStart)
    
    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    // Initialize controls timer
    resetControlsTimer()
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
      clearInterval(progressInterval)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [resetControlsTimer])

  // Create or update the model-viewer element
  useEffect(() => {
    if (modelViewerLoaded && containerRef.current && modelUrl) {
      const modelViewer = document.createElement('model-viewer')
      
      // Set base attributes
      modelViewer.setAttribute('src', modelUrl)
      modelViewer.setAttribute('alt', `3D model of ${dishName}`)
      modelViewer.setAttribute('camera-controls', '')
      modelViewer.setAttribute('touch-action', 'pan-y')
      modelViewer.setAttribute('loading', 'eager')
      modelViewer.setAttribute('reveal', 'auto')
      modelViewer.setAttribute('shadow-intensity', '1')
      modelViewer.setAttribute('shadow-softness', '0.5')
      modelViewer.setAttribute('exposure', '1')
      modelViewer.setAttribute('tone-mapping', 'aces')
      
      // Set view mode specific attributes
      if (viewMode === '3d') {
        // 3D Mode - No AR, better for desktop viewing
        modelViewer.setAttribute('auto-rotate', '')
        modelViewer.setAttribute('auto-rotate-delay', '1000')
        modelViewer.setAttribute('rotation-per-second', '20deg')
        modelViewer.setAttribute('environment-image', 'neutral')
        modelViewer.setAttribute('min-camera-orbit', 'auto 0deg auto')
        modelViewer.setAttribute('max-camera-orbit', 'auto 180deg auto')
        modelViewer.setAttribute('camera-orbit', '45deg 75deg auto')
        modelViewer.removeAttribute('ar')
        modelViewer.removeAttribute('ar-modes')
      } else if (viewMode === 'ar') {
        // AR Mode - Camera enabled for mobile AR experience
        modelViewer.setAttribute('ar', '')
        modelViewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look')
        modelViewer.setAttribute('ar-scale', 'auto')
        modelViewer.setAttribute('ar-placement', 'floor')
        modelViewer.setAttribute('min-camera-orbit', 'auto 90deg auto')
        modelViewer.setAttribute('max-camera-orbit', 'auto 90deg auto')
        modelViewer.removeAttribute('auto-rotate')
        // Add iOS-specific quick-look attributes
        if (/iPhone|iPad/.test(navigator.userAgent)) {
          modelViewer.setAttribute('ios-src', modelUrl.replace('.glb', '.usdz'))
        }
      }
      
      // Set styles
      modelViewer.style.width = '100%'
      modelViewer.style.height = '100%'
      modelViewer.style.backgroundColor = viewMode === 'ar' ? 'transparent' : '#f8fafc'
      
      // Add event listeners
      modelViewer.addEventListener('load', () => {
        setModelLoaded(true)
        toast.success(`${viewMode === 'ar' ? 'AR' : '3D'} model loaded successfully!`)
      })
      
      modelViewer.addEventListener('error', () => {
        setError('Failed to load 3D model')
        toast.error('Failed to load 3D model')
      })
      
      // Create AR button only for AR mode
      if (viewMode === 'ar') {
        const arButton = document.createElement('button')
        arButton.setAttribute('slot', 'ar-button')
        arButton.className = 'absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl shadow-2xl font-semibold flex items-center gap-2 md:gap-3 transition-all duration-300 transform hover:scale-105 border border-white/20 backdrop-blur-sm text-sm md:text-base active:scale-95 touch-manipulation z-10'
        
        // Add vibration feedback for mobile
        arButton.addEventListener('touchstart', () => {
          if ('vibrate' in navigator) {
            navigator.vibrate(50)
          }
        })
        
        const arButtonContent = `
          <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span class="font-medium">Open AR Camera</span>
          ${arMode ? `<span class="bg-white/25 text-white text-xs px-2 py-0.5 rounded-full hidden md:inline">${
            arMode === 'webxr' ? 'WebXR' :
            arMode === 'quick-look' ? 'iOS AR' :
            arMode === 'scene-viewer' ? 'Android AR' : ''
          }</span>` : ''}
        `
        arButton.innerHTML = arButtonContent
        modelViewer.appendChild(arButton)
      }
      
      // Add loading poster
      const poster = document.createElement('div')
      poster.setAttribute('slot', 'poster')
      poster.className = `absolute inset-0 flex items-center justify-center ${
        viewMode === 'ar' 
          ? 'bg-gradient-to-br from-purple-900 via-black to-indigo-900' 
          : 'bg-gradient-to-br from-slate-100 via-white to-slate-200'
      }`
      poster.innerHTML = `
        <div class="text-center ${viewMode === 'ar' ? 'text-white' : 'text-gray-800'} space-y-4">
          <div class="relative">
            <svg class="h-12 w-12 animate-spin ${viewMode === 'ar' ? 'text-purple-400' : 'text-blue-500'} mx-auto" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div class="absolute inset-0 ${viewMode === 'ar' ? 'bg-purple-500/20' : 'bg-blue-500/20'} rounded-full animate-pulse"></div>
          </div>
          <div class="space-y-2">
            <p class="text-lg font-medium">Loading ${viewMode === 'ar' ? 'AR' : '3D'} model...</p>
            <p class="text-sm ${viewMode === 'ar' ? 'text-gray-400' : 'text-gray-600'}">
              ${viewMode === 'ar' ? 'Preparing your AR camera experience' : 'Preparing 3D viewer'}
            </p>
          </div>
        </div>
      `
      
      modelViewer.appendChild(poster)
      
      // Clear container and add model viewer
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(modelViewer)
      
      modelViewerRef.current = modelViewer as ModelViewer
    }
  }, [modelViewerLoaded, modelUrl, dishName, arMode, viewMode])

  // Switch view mode
  const switchViewMode = (mode: ViewMode) => {
    setViewMode(mode)
    setModelLoaded(false)
    toast.success(`Switched to ${mode === 'ar' ? 'AR' : '3D'} mode`)
  }

  // Fullscreen toggle
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

  // Reset camera view
  const resetView = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.resetTurntableRotation()
      if (modelViewerRef.current.jumpCameraToGoal) {
        modelViewerRef.current.jumpCameraToGoal()
      }
      toast.success('View reset')
    }
  }

  // Share model
  const shareModel = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${dishName} - ${viewMode === 'ar' ? 'AR' : '3D'} Model`,
          text: `Check out this interactive ${viewMode === 'ar' ? 'AR' : '3D'} model of ${dishName}!`,
          url: window.location.href,
        })
        toast.success('Shared successfully!')
      } catch (err) {
        console.log('Error sharing:', err)
        // Fallback: copy to clipboard
        await navigator.clipboard?.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard?.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  if (!modelUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="mx-auto w-20 h-20 bg-destructive/20 rounded-2xl flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">No Model Specified</h1>
            <p className="text-muted-foreground">Please provide a valid 3D model URL to continue</p>
          </div>
          <Button 
            onClick={() => window.close()} 
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900/20 via-background to-indigo-900/20 dark:from-purple-900 dark:via-black dark:to-indigo-900">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="relative">
            <div className="mx-auto w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground">Loading AR Experience</h1>
            <p className="text-muted-foreground">Preparing {dishName} in immersive 3D...</p>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className="h-3 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground">{Math.round(loadingProgress)}% loaded</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-destructive/20 via-background to-muted">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="mx-auto w-20 h-20 bg-destructive/20 rounded-2xl flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Error Loading AR</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-20 p-4 transition-all duration-300 ${
        showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <div className="flex items-center justify-between">
          <Button 
            onClick={() => window.close()} 
            variant="ghost" 
            className="backdrop-blur-xl bg-card/50 border border-border/50 hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center">
            <h1 className="text-foreground font-bold text-xl">{dishName}</h1>
            <div className="flex items-center gap-2 justify-center mt-2">
              <Badge className={`text-xs ${
                viewMode === 'ar' 
                  ? 'bg-purple-500/20 text-purple-600 border-purple-500/30' 
                  : 'bg-blue-500/20 text-blue-600 border-blue-500/30'
              }`}>
                {viewMode === 'ar' ? (
                  <>
                    <Camera className="h-3 w-3 mr-1" />
                    AR Mode
                  </>
                ) : (
                  <>
                    <Cube className="h-3 w-3 mr-1" />
                    3D Mode
                  </>
                )}
              </Badge>
              {arMode && viewMode === 'ar' && (
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  {arMode === 'webxr' && (
                    <>
                      <Monitor className="h-3 w-3 mr-1" />
                      WebXR Ready
                    </>
                  )}
                  {arMode === 'quick-look' && (
                    <>
                      <Smartphone className="h-3 w-3 mr-1" />
                      iOS AR Ready
                    </>
                  )}
                  {arMode === 'scene-viewer' && (
                    <>
                      <Smartphone className="h-3 w-3 mr-1" />
                      Android AR Ready
                    </>
                  )}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={shareModel}
              variant="ghost" 
              size="icon"
              className="backdrop-blur-xl bg-card/50 border border-border/50 hover:bg-accent"
            >
              <Share className="h-4 w-4" />
            </Button>
            <Button 
              onClick={toggleFullscreen}
              variant="ghost" 
              size="icon"
              className="backdrop-blur-xl bg-card/50 border border-border/50 hover:bg-accent"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 z-20 transition-all duration-300 ${
        showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <div className="flex items-center gap-2 bg-card/90 backdrop-blur-xl rounded-2xl p-2 border border-border shadow-lg">
          <Button
            onClick={() => switchViewMode('3d')}
            variant={viewMode === '3d' ? 'default' : 'ghost'}
            size="sm"
            className={`${
              viewMode === '3d' 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'hover:bg-blue-500/10 text-blue-600'
            }`}
          >
            <Cube className="h-4 w-4 mr-2" />
            3D View
          </Button>
          <Button
            onClick={() => switchViewMode('ar')}
            variant={viewMode === 'ar' ? 'default' : 'ghost'}
            size="sm"
            className={`${
              viewMode === 'ar' 
                ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                : 'hover:bg-purple-500/10 text-purple-600'
            }`}
          >
            <Camera className="h-4 w-4 mr-2" />
            AR View
          </Button>
        </div>
      </div>

      {/* 3D Model Viewer */}
      <div className="h-screen w-full relative">
        <div 
          ref={containerRef}
          className="w-full h-full"
        />

        {/* Model loaded indicator */}
        {modelLoaded && (
          <div className="absolute top-6 right-6 z-10">
            <div className={`border rounded-xl px-4 py-2 backdrop-blur-xl ${
              viewMode === 'ar'
                ? 'bg-purple-500/20 border-purple-500/30'
                : 'bg-green-500/20 border-green-500/30'
            }`}>
              <div className={`flex items-center gap-2 text-sm ${
                viewMode === 'ar'
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                <CheckCircle className="h-4 w-4" />
                <span>{viewMode === 'ar' ? 'AR Ready' : '3D Ready'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      <div className={`absolute bottom-8 right-8 space-y-3 z-20 transition-all duration-300 ${
        showControls ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        <div className="bg-card/90 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl min-w-[240px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Controls
            </h3>
          </div>
          
          <div className="space-y-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start"
              onClick={resetView}
            >
              <RotateCcw className="h-4 w-4 mr-3" />
              Reset View
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => setShowControls(false)}
            >
              <Eye className="h-4 w-4 mr-3" />
              Hide Controls
            </Button>
          </div>
          
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-foreground text-sm font-medium mb-3">
              {viewMode === 'ar' ? 'AR Mode Guide' : '3D Navigation'}
            </h4>
            <div className="text-muted-foreground text-xs space-y-2">
              {viewMode === 'ar' ? (
                <>
                  <p className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
                      <Camera className="h-3 w-3" />
                    </div>
                    Tap "Open AR Camera" to start
                  </p>
                  <p className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
                      <ScanLine className="h-3 w-3" />
                    </div>
                    Point at flat surface (table/floor)
                  </p>
                  <p className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
                      <View className="h-3 w-3" />
                    </div>
                    Tap to place dish in real world
                  </p>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
                      <RotateCcw className="h-3 w-3" />
                    </div>
                    Drag to rotate model
                  </p>
                  <p className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
                      <Cube className="h-3 w-3" />
                    </div>
                    Pinch or scroll to zoom
                  </p>
                  <p className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
                      <Camera className="h-3 w-3" />
                    </div>
                    Switch to AR mode for camera
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mode Info */}
      <div className={`absolute bottom-8 left-6 z-20 transition-all duration-300 ${
        showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}>
        <div className={`rounded-2xl p-4 backdrop-blur-xl border shadow-2xl max-w-sm ${
          viewMode === 'ar'
            ? (isARSupported || arMode 
                ? 'bg-purple-500/20 border-purple-500/30' 
                : 'bg-amber-500/20 border-amber-500/30')
            : 'bg-blue-500/20 border-blue-500/30'
        }`}>
          <div className="flex items-start gap-3">
            {viewMode === 'ar' ? (
              isARSupported || arMode ? (
                <CheckCircle className="h-5 w-5 text-purple-500 dark:text-purple-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5" />
              )
            ) : (
              <CheckCircle className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5" />
            )}
            <div>
              <p className={`font-semibold text-sm ${
                viewMode === 'ar'
                  ? (isARSupported || arMode 
                      ? 'text-purple-700 dark:text-purple-300' 
                      : 'text-amber-700 dark:text-amber-300')
                  : 'text-blue-700 dark:text-blue-300'
              }`}>
                {viewMode === 'ar' 
                  ? (isARSupported || arMode ? 'AR Mode Active' : 'AR Limited')
                  : '3D Mode Active'
                }
              </p>
              <p className={`text-xs mt-1 ${
                viewMode === 'ar'
                  ? (isARSupported || arMode 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-amber-600 dark:text-amber-400')
                  : 'text-blue-600 dark:text-blue-400'
              }`}>
                {viewMode === 'ar' 
                  ? (isARSupported || arMode 
                      ? `AR camera ready with ${arMode?.toUpperCase()}`
                      : "Limited AR support - try mobile device")
                  : "Interactive 3D model with full controls"
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Show controls hint */}
      {!showControls && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-card/80 backdrop-blur-xl rounded-full px-4 py-2 border border-border">
            <p className="text-muted-foreground text-xs flex items-center gap-2">
              <Eye className="h-3 w-3" />
              Touch or move mouse to show controls
            </p>
          </div>
        </div>
      )}
    </div>
  )
}