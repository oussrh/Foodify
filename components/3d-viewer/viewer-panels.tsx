'use client'

// The 3D page's chrome around the model: the header bar, the controls panel with its
// navigation help, the model info card, and the button that brings the controls back.
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Eye, Info, Maximize, Minimize, Monitor, Move3D, Pause, Play, RotateCcw, Settings, ZoomIn } from 'lucide-react'

interface ViewerHeaderProps {
  dishName: string
  showControls: boolean
  isFullscreen: boolean
  onToggleControls: () => void
  onToggleFullscreen: () => void
}

/**
 * The 3D page's top bar: Back closes the window, plus the controls and fullscreen toggles. It
 * slides out of view when the controls are hidden.
 */
export function ViewerHeader({ dishName, showControls, isFullscreen, onToggleControls, onToggleFullscreen }: ViewerHeaderProps) {
  return (
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
              onClick={onToggleControls}
              variant="ghost"
              size="icon"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              onClick={onToggleFullscreen}
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
  )
}

interface ControlsPanelProps {
  showControls: boolean
  isAutoRotating: boolean
  showInfo: boolean
  onReset: () => void
  onToggleAutoRotate: () => void
  onToggleInfo: () => void
}

/**
 * The panel in the bottom-right corner with reset, auto-rotate and info toggles and the navigation
 * help; it slides off-screen when the controls are hidden.
 */
export function ControlsPanel({ showControls, isAutoRotating, showInfo, onReset, onToggleAutoRotate, onToggleInfo }: ControlsPanelProps) {
  return (
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
            onClick={onReset}
          >
            <RotateCcw className="h-4 w-4 mr-3" />
            Reset View
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-10"
            onClick={onToggleAutoRotate}
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
            onClick={onToggleInfo}
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
  )
}

/**
 * The card in the bottom-left corner naming the dish and describing the preview; it slides away
 * when not visible rather than unmounting.
 */
export function ModelInfoPanel({ dishName, visible }: { dishName: string; visible: boolean }) {
  return (
    <div className={`absolute bottom-8 left-8 transition-all duration-300 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
      <div className="bg-card/90 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-linear-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
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
  )
}

/** Toggle Controls Button (when hidden) */
export function ShowControlsButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="absolute top-1/2 right-4 -translate-y-1/2 bg-card/90 backdrop-blur-xl border border-border hover:bg-accent rounded-full w-12 h-12 p-0"
      size="icon"
    >
      <Settings className="h-5 w-5" />
    </Button>
  )
}
