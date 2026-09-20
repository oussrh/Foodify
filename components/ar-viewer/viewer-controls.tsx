'use client'

// The AR viewer's control panels: the compact column on phone and tablet, and the desktop
// panel with the same actions plus a guide for the current mode. Both slide out with the
// controls.
import { Button } from '@/components/ui/button'
import { Box, Camera, Eye, RotateCcw, ScanLine, Settings, View, ZoomIn, ZoomOut } from 'lucide-react'
import type { ViewMode } from '@/components/model-viewer/element'

interface ControlsProps {
  showControls: boolean
  onReset: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onHide: () => void
}

/** Compact Controls (mobile / tablet) - stays clear of the centered AR button */
export function CompactControls({ showControls, onReset, onZoomIn, onZoomOut, onHide }: ControlsProps) {
  return (
    <div className={`lg:hidden absolute bottom-6 right-4 z-20 transition-all duration-300 ${
      showControls ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="flex flex-col gap-1 bg-card/90 backdrop-blur-xl rounded-2xl p-1.5 border border-border shadow-2xl">
        <Button variant="ghost" size="icon" onClick={onReset} aria-label="Reset view">
          <RotateCcw className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onZoomIn} aria-label="Zoom in">
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onZoomOut} aria-label="Zoom out">
          <ZoomOut className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onHide} aria-label="Hide controls">
          <Eye className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

function ArGuide() {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
          <Camera className="h-3 w-3" />
        </div>
        Tap &ldquo;Open AR Camera&rdquo; to start
      </div>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
          <ScanLine className="h-3 w-3" />
        </div>
        Point at flat surface (table/floor)
      </div>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
          <View className="h-3 w-3" />
        </div>
        Tap to place dish in real world
      </div>
    </>
  )
}

function ThreeDGuide() {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
          <RotateCcw className="h-3 w-3" />
        </div>
        Drag to rotate model horizontally
      </div>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
          <Box className="h-3 w-3" />
        </div>
        Pinch or scroll to zoom in/out
      </div>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
          <View className="h-3 w-3" />
        </div>
        View from top, sides, and angles
      </div>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
          <Camera className="h-3 w-3" />
        </div>
        Switch to AR mode for camera
      </div>
    </>
  )
}

/** Controls Overlay (desktop) */
export function DesktopControls({ viewMode, showControls, onReset, onZoomIn, onZoomOut, onHide }: ControlsProps & { viewMode: ViewMode }) {
  return (
    <div className={`hidden lg:block absolute bottom-8 right-8 space-y-3 z-20 transition-all duration-300 ${
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
            onClick={onReset}
          >
            <RotateCcw className="h-4 w-4 mr-3" />
            Reset View
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start"
              onClick={onZoomIn}
            >
              <ZoomIn className="h-4 w-4 mr-3" />
              Zoom In
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start"
              onClick={onZoomOut}
            >
              <ZoomOut className="h-4 w-4 mr-3" />
              Zoom Out
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onHide}
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
            {viewMode === 'ar' ? <ArGuide /> : <ThreeDGuide />}
          </div>
        </div>
      </div>
    </div>
  )
}
