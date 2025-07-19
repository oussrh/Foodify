"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Eye, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Move3D,
  Camera,
  AlertCircle,
  Loader2,
  X,
  Maximize,
  Play,
  Pause
} from 'lucide-react'

interface ARModelPreviewProps {
  isOpen: boolean
  onClose: () => void
  modelUrl: string
  modelType: 'usdz' | 'glb'
  dishName?: string
}

export default function ARModelPreview({
  isOpen,
  onClose,
  modelUrl,
  modelType,
  dishName = 'Dish Preview'
}: ARModelPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAutoRotating, setIsAutoRotating] = useState(true)

  useEffect(() => {
    if (isOpen) {
      if (modelType === 'glb') {
        // Load model-viewer script if not already loaded
        if (!document.querySelector('script[src*="model-viewer"]')) {
          const script = document.createElement('script')
          script.type = 'module'
          script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'
          script.onload = () => setIsLoading(false)
          script.onerror = () => {
            setError('Failed to load 3D viewer')
            setIsLoading(false)
          }
          document.head.appendChild(script)
        } else {
          setIsLoading(false)
        }
      } else {
        // For USDZ, no loading needed
        setIsLoading(false)
      }
    }
  }, [isOpen, modelType])

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

  const resetView = () => {
    const modelViewer = document.querySelector('model-viewer')
    if (modelViewer) {
      // @ts-ignore
      modelViewer.resetTurntableRotation()
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = modelUrl
    link.download = `${dishName.replace(/\s+/g, '_')}.${modelType}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              AR Model Preview: {dishName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">
                {modelType}
              </span>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 relative">
          {modelType === 'usdz' ? (
            // USDZ Preview (iOS-specific format)
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="text-center space-y-4 p-8">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Camera className="h-12 w-12 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">USDZ Model Ready</h3>
                  <p className="text-gray-600 max-w-md">
                    This USDZ file is optimized for iOS devices. Use iOS Safari or compatible apps to view in AR.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button 
                    onClick={handleDownload}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Download USDZ File
                  </Button>
                  <p className="text-sm text-gray-500">
                    Open this file on an iPhone or iPad to preview in AR Quick Look
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // GLB Preview (3D viewer)
            <div className="h-full relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
                    <p className="text-gray-600">Loading 3D model...</p>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                    <p className="text-gray-600">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                      Retry
                    </Button>
                  </div>
                </div>
              )}
              
              {!isLoading && !error && (
                <>      
                  {/* @ts-ignore */}
                  <model-viewer
                    src={modelUrl}
                    alt={`3D model of ${dishName}`}
                    camera-controls
                    touch-action="pan-y"
                    auto-rotate={isAutoRotating ? "true" : "false"}
                    auto-rotate-delay="1000"
                    rotation-per-second="20deg"
                    environment-image="neutral"
                    shadow-intensity="1"
                    exposure="1"
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#f8fafc'
                    }}
                    loading="eager"
                    reveal="auto"
                    onLoad={() => console.log('Model loaded successfully:', modelUrl)}
                    onError={(e: any) => {
                      console.error('Model failed to load:', e, modelUrl)
                      setError('Failed to load 3D model')
                    }}
                  >
                  </model-viewer>
                  
                  {/* Controls Overlay */}
                  <div className="absolute top-4 right-4 space-y-2">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 space-y-2 shadow-lg">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={resetView}
                        className="w-full justify-start text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-2" />
                        Reset
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={toggleAutoRotate}
                        className="w-full justify-start text-xs"
                      >
                        {isAutoRotating ? (
                          <>
                            <Pause className="h-3 w-3 mr-2" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-2" />
                            Rotate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Instructions */}
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 space-y-1 shadow-lg">
                      <p className="text-xs font-medium text-gray-800">Controls:</p>
                      <div className="space-y-1 text-xs text-gray-600">
                        <p className="flex items-center gap-1">
                          <Move3D className="h-3 w-3" />
                          Drag to rotate
                        </p>
                        <p className="flex items-center gap-1">
                          <ZoomIn className="h-3 w-3" />
                          Scroll to zoom
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Full 3D Viewer Link */}
                  <div className="absolute bottom-4 right-4">
                    <Button
                      onClick={() => {
                        window.open(
                          `/3d-viewer?model=${encodeURIComponent(modelUrl)}&name=${encodeURIComponent(dishName)}`,
                          '_blank'
                        )
                      }}
                      variant="outline"
                      size="sm"
                      className="bg-white/90 backdrop-blur-sm"
                    >
                      <Maximize className="h-4 w-4 mr-2" />
                      Full Screen
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}