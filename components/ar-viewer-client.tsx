"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Move3D,
  Camera,
  AlertCircle,
  Loader2,
  Fullscreen,
  Share,
  Info,
  Settings,
  Eye,
  Smartphone,
  Monitor,
  RefreshCw,
  Download,
  CheckCircle,
  X
} from 'lucide-react'

export default function ARViewerClient() {
  const searchParams = useSearchParams()
  const modelUrl = searchParams.get('model')
  const dishName = searchParams.get('name') || 'Dish'
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isARSupported, setIsARSupported] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [arMode, setArMode] = useState<'webxr' | 'scene-viewer' | 'quick-look' | null>(null)
  
  const modelViewerRef = useRef<any>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  // Auto-hide controls after inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
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
    document.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
      clearInterval(progressInterval)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [resetControlsTimer])

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Reset camera view
  const resetView = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.resetTurntableRotation()
      modelViewerRef.current.jumpCameraToGoal()
    }
  }

  // Share model
  const shareModel = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${dishName} - 3D Model`,
          text: `Check out this 3D model of ${dishName}!`,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      // You could add a toast notification here
    }
  }

  if (!modelUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">No Model Specified</h1>
            <p className="text-gray-400">Please provide a valid 3D model URL to continue</p>
          </div>
          <Button 
            onClick={() => window.close()} 
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-black to-indigo-900">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="relative">
            <div className="mx-auto w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
            </div>
            <div className="absolute inset-0 bg-purple-500/10 rounded-2xl animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-white">Loading AR Experience</h1>
            <p className="text-gray-300">Preparing {dishName} in 3D...</p>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-400">{Math.round(loadingProgress)}% loaded</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 via-black to-gray-900">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Error Loading AR</h1>
            <p className="text-gray-400">{error}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="border-blue-600 text-blue-400 hover:bg-blue-900/50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button 
              onClick={() => window.close()} 
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
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
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-20 p-4 transition-all duration-300 ${
        showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <div className="flex items-center justify-between">
          <Button 
            onClick={() => window.close()} 
            variant="ghost" 
            className="text-white hover:bg-white/20 backdrop-blur-sm bg-black/30 border border-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center">
            <h1 className="text-white font-bold text-lg">{dishName}</h1>
            <div className="flex items-center gap-2 justify-center mt-1">
              {arMode && (
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                  {arMode === 'webxr' && (
                    <>
                      <Monitor className="h-3 w-3 mr-1" />
                      WebXR
                    </>
                  )}
                  {arMode === 'quick-look' && (
                    <>
                      <Smartphone className="h-3 w-3 mr-1" />
                      iOS AR
                    </>
                  )}
                  {arMode === 'scene-viewer' && (
                    <>
                      <Smartphone className="h-3 w-3 mr-1" />
                      Android AR
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
              size="sm"
              className="text-white hover:bg-white/20 backdrop-blur-sm bg-black/30 border border-white/20"
            >
              <Share className="h-4 w-4" />
            </Button>
            <Button 
              onClick={toggleFullscreen}
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/20 backdrop-blur-sm bg-black/30 border border-white/20"
            >
              <Fullscreen className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 3D Model Viewer */}
      <div className="h-screen w-full relative">
        {/* @ts-ignore */}
        <model-viewer
          ref={modelViewerRef}
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
          exposure="1"
          tone-mapping="aces"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent'
          }}
          loading="eager"
          reveal="auto"
          onLoad={() => setModelLoaded(true)}
          onError={() => setError('Failed to load 3D model')}
        >
          {/* AR Button */}
          <button 
            slot="ar-button" 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-purple-600 hover:via-pink-600 hover:to-indigo-600 text-white px-8 py-4 rounded-2xl shadow-2xl font-semibold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 border border-white/20 backdrop-blur-sm"
          >
            <Camera className="h-5 w-5" />
            <span>View in AR</span>
            {arMode && (
              <Badge className="bg-white/20 text-white text-xs ml-2">
                {arMode === 'webxr' && 'WebXR'}
                {arMode === 'quick-look' && 'iOS'}
                {arMode === 'scene-viewer' && 'Android'}
              </Badge>
            )}
          </button>
          
          {/* Loading indicator */}
          <div slot="poster" className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-indigo-900">
            <div className="text-center text-white space-y-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto" />
                <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium">Loading 3D model...</p>
                <p className="text-sm text-gray-400">Please wait while we prepare your AR experience</p>
              </div>
            </div>
          </div>
        </model-viewer>

        {/* Model loaded indicator */}
        {modelLoaded && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-green-300 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Model Ready</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      <div className={`absolute bottom-8 right-8 space-y-3 z-20 transition-all duration-300 ${
        showControls ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        <div className="bg-black/50 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-2xl">
          <div className="space-y-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 w-full justify-start"
              onClick={resetView}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset View
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 w-full justify-start"
              onClick={() => setShowControls(!showControls)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showControls ? 'Hide Controls' : 'Show Controls'}
            </Button>
          </div>
          
          <div className="mt-4 pt-3 border-t border-white/20">
            <div className="text-white text-xs space-y-2">
              <p className="flex items-center gap-2 text-gray-300">
                <Move3D className="h-3 w-3" />
                Drag to rotate
              </p>
              <p className="flex items-center gap-2 text-gray-300">
                <ZoomIn className="h-3 w-3" />
                Pinch to zoom
              </p>
              <p className="flex items-center gap-2 text-gray-300">
                <Camera className="h-3 w-3" />
                Tap AR for immersive view
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AR Capability Indicator */}
      <div className={`absolute bottom-8 left-4 z-20 transition-all duration-300 ${
        showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}>
        <div className={`rounded-xl p-4 backdrop-blur-lg border shadow-2xl ${
          isARSupported || arMode 
            ? 'bg-green-500/20 border-green-500/30' 
            : 'bg-amber-500/20 border-amber-500/30'
        }`}>
          <div className="flex items-start gap-3">
            {isARSupported || arMode ? (
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
            )}
            <div>
              <p className={`font-medium text-sm ${
                isARSupported || arMode ? 'text-green-300' : 'text-amber-300'
              }`}>
                {isARSupported || arMode ? 'AR Available' : 'AR Limited'}
              </p>
              <p className={`text-xs mt-1 ${
                isARSupported || arMode ? 'text-green-200' : 'text-amber-200'
              }`}>
                {isARSupported || arMode 
                  ? `Your device supports ${arMode?.toUpperCase()} AR mode`
                  : "Your device doesn&apos;t support AR, but you can still explore the 3D model"
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Click anywhere to show controls hint */}
      {!showControls && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <p className="text-white text-xs flex items-center gap-2">
              <Info className="h-3 w-3" />
              Move mouse to show controls
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
