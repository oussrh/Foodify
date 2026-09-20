// PathFile: components/ar-model-preview.tsx
"use client"

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Move3D,
  Camera,
  AlertCircle,
  Loader2,
  X,
  Play,
  Pause,
  Download,
  Smartphone,
  Monitor,
  ArrowUpRight,
  Info,
  Settings,
} from 'lucide-react'

interface ARModelPreviewProps {
  isOpen: boolean
  onClose: () => void
  modelUrl: string
  modelType: 'usdz' | 'glb'
  dishName?: string
}

// Define ModelViewer interface for better type safety
interface ModelViewer extends HTMLElement {
  resetTurntableRotation(): void;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
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
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const modelViewerLoaded = useSyncExternalStore(subscribeModelViewer, isModelViewerDefined, () => false)
  const isLoading = !error && (modelType === 'glb' ? !modelViewerLoaded : !isOpen)
  const containerRef = useRef<HTMLDivElement>(null)
  const modelViewerRef = useRef<ModelViewer | null>(null)

  // The viewer script is injected once; the registry (above) says when the element exists.
  useEffect(() => {
    if (!isOpen || modelType !== 'glb' || isModelViewerDefined()) return
    if (document.querySelector('script[src*="model-viewer"]')) return
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'
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
      <DialogContent className="max-w-5xl h-[85vh] p-0 bg-card border-border">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span>AR Model Preview</span>
                <p className="text-sm text-muted-foreground font-normal mt-1">
                  {dishName}
                </p>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                {modelType === 'usdz' ? (
                  <div className="flex items-center gap-1">
                    <Smartphone className="h-3 w-3" />
                    {modelType}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Monitor className="h-3 w-3" />
                    {modelType}
                  </div>
                )}
              </Badge>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 relative overflow-hidden">
          {modelType === 'usdz' ? (
            // USDZ Preview (iOS-specific format)
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-6 p-8 max-w-md">
                <div className="w-24 h-24 rounded-lg flex items-center justify-center mx-auto">
                  <Camera className="h-12 w-12 text-white" />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-foreground">USDZ Model Ready</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    This USDZ file is optimized for iOS devices with ARKit support. 
                    Open with iOS Safari or compatible apps to view in augmented reality.
                  </p>
                </div>

                <div className="p-4 bg-muted border border-border rounded-md">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-muted-foreground dark:text-muted-foreground mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-muted-foreground mb-1">AR Quick Look Compatible</p>
                      <p className="text-muted-foreground dark:text-muted-foreground">
                        Works on iPhone 6s and later, iPad (5th generation) and later
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    onClick={handleDownload}
                    className="w-full h-12 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download USDZ File
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Optimized for AR
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // GLB Preview (3D viewer)
            <div className="h-full relative bg-background">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                  <div className="text-center space-y-4 p-8">
                    <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center mx-auto">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">Loading 3D Model</h3>
                      <p className="text-muted-foreground">Preparing interactive preview...</p>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                  <div className="text-center space-y-4 p-8">
                    <div className="w-16 h-16 bg-destructive/20 rounded-lg flex items-center justify-center mx-auto">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">Failed to Load Model</h3>
                      <p className="text-muted-foreground max-w-md">{error}</p>
                    </div>
                    <Button onClick={() => window.location.reload()} variant="outline">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              )}
              
              {!isLoading && !error && (
                <>
                  {/* Model Viewer Container */}
                  <div 
                    ref={containerRef}
                    className="w-full h-full"
                  />
                  
                  {/* Controls Overlay */}
                  <div className="absolute top-6 right-6">
                    <div className="bg-card/90 rounded-md p-4 space-y-3 border border-border min-w-[160px]">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Settings className="h-3 w-3" />
                          Controls
                        </h4>
                      </div>
                      
                      <div className="space-y-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={resetView}
                          className="w-full justify-start text-xs h-8"
                        >
                          <RotateCcw className="h-3 w-3 mr-2" />
                          Reset View
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={toggleAutoRotate}
                          className="w-full justify-start text-xs h-8"
                        >
                          {isAutoRotating ? (
                            <>
                              <Pause className="h-3 w-3 mr-2" />
                              Stop Rotation
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-2" />
                              Auto Rotate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Instructions */}
                  <div className="absolute bottom-6 left-6">
                    <div className="bg-card/90 rounded-md p-4 border border-border max-w-xs">
                      <h4 className="text-sm font-semibold text-foreground mb-3">How to Navigate</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
                            <Move3D className="h-3 w-3" />
                          </div>
                          <span>Click & drag to rotate</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
                            <ZoomIn className="h-3 w-3" />
                          </div>
                          <span>Scroll or pinch to zoom</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="absolute bottom-6 right-6 flex gap-3">
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      size="sm"
                      className="bg-card/90 border-border"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    
                    <Button
                      onClick={() => {
                        window.open(
                          `/3d-viewer?model=${encodeURIComponent(modelUrl)}&name=${encodeURIComponent(dishName)}`,
                          '_blank',
                          'width=1200,height=800'
                        )
                      }}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="sm"
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Full Screen
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Monitor className="h-4 w-4" />
              <span>
                {modelType === 'usdz' ? 'iOS AR Quick Look Compatible' : 'Interactive 3D Preview'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {modelType === 'usdz' ? 'AR Ready' : '3D Model'}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
