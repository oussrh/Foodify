'use client'

// The top of the AR viewer: the back button, the dish name with its mode and AR-readiness
// badges, share and fullscreen; and the 3D/AR toggle under it. Both slide out of view with
// the controls.
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Box, Camera, Maximize, Minimize, Monitor, Share, Smartphone } from 'lucide-react'
import type { ArMode, ViewMode } from '@/components/model-viewer/element'

interface ViewerHeaderProps {
  dishName: string
  viewMode: ViewMode
  arMode: ArMode | null
  showControls: boolean
  isFullscreen: boolean
  onShare: () => void
  onToggleFullscreen: () => void
}

/**
 * The viewer's top bar: Back closes the window, the dish name carries its mode badge and, in AR,
 * which platform viewer is ready, then share and fullscreen. It slides away when the controls hide.
 */
export function ViewerHeader({ dishName, viewMode, arMode, showControls, isFullscreen, onShare, onToggleFullscreen }: ViewerHeaderProps) {
  return (
    <div className={`absolute top-0 left-0 right-0 z-20 p-4 transition-all duration-300 ${
      showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
    }`}>
      <div className="flex items-center justify-between">
        <Button
          onClick={() => window.close()}
          variant="ghost"
          className="backdrop-blur-xl bg-card/50 border border-border/50 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <div className="text-center min-w-0 px-2">
          <h1 className="text-foreground font-bold text-lg md:text-xl truncate">{dishName}</h1>
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
                  <Box className="h-3 w-3 mr-1" />
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
            onClick={onShare}
            variant="ghost"
            size="icon"
            className="backdrop-blur-xl bg-card/50 border border-border/50 hover:bg-accent"
          >
            <Share className="h-4 w-4" />
          </Button>
          <Button
            onClick={onToggleFullscreen}
            variant="ghost"
            size="icon"
            className="backdrop-blur-xl bg-card/50 border border-border/50 hover:bg-accent"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ViewModeToggleProps {
  viewMode: ViewMode
  showControls: boolean
  onSwitch: (mode: ViewMode) => void
}

/**
 * The 3D View / AR View switch under the header. It only reports the chosen mode; the caller
 * switches the viewer. It hides along with the controls.
 */
export function ViewModeToggle({ viewMode, showControls, onSwitch }: ViewModeToggleProps) {
  return (
    <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 w-max z-20 transition-all duration-300 ${
      showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
    }`}>
      <div className="flex items-center gap-2 bg-card/90 backdrop-blur-xl rounded-2xl p-2 border border-border shadow-lg">
        <Button
          onClick={() => onSwitch('3d')}
          variant={viewMode === '3d' ? 'default' : 'ghost'}
          size="sm"
          className={`${
            viewMode === '3d'
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'hover:bg-blue-500/10 text-blue-600'
          }`}
        >
          <Box className="h-4 w-4 mr-2" />
          3D View
        </Button>
        <Button
          onClick={() => onSwitch('ar')}
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
  )
}
