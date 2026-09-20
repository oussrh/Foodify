'use client'

// The GLB side of the preview: the <model-viewer> container with its loading and error
// overlays, the controls, the navigation help and the download / full-screen actions.
import type { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowUpRight, Download, Loader2, Move3D, Pause, Play, RotateCcw, Settings, ZoomIn } from 'lucide-react'

interface GlbPaneProps {
  isLoading: boolean
  error: string | null
  containerRef: RefObject<HTMLDivElement | null>
  isAutoRotating: boolean
  onReset: () => void
  onToggleAutoRotate: () => void
  onDownload: () => void
  onFullScreen: () => void
}

export function GlbPane({ isLoading, error, containerRef, isAutoRotating, onReset, onToggleAutoRotate, onDownload, onFullScreen }: GlbPaneProps) {
  return (
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
                  onClick={onReset}
                  className="w-full justify-start text-xs h-8"
                >
                  <RotateCcw className="h-3 w-3 mr-2" />
                  Reset View
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleAutoRotate}
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
              onClick={onDownload}
              variant="outline"
              size="sm"
              className="bg-card/90 border-border"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>

            <Button
              onClick={onFullScreen}
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
  )
}
