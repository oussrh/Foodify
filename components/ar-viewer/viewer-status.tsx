'use client'

// What the AR viewer says about its state around the model: the "ready" badge once the
// model has loaded, the desktop info card on the mode (purple for AR, amber when AR is
// limited, blue for 3D), and the hint shown while the controls are hidden.
import { AlertCircle, CheckCircle, Eye } from 'lucide-react'
import type { ArMode, ViewMode } from '@/components/model-viewer/element'

/** Model loaded indicator */
export function ModelLoadedBadge({ viewMode }: { viewMode: ViewMode }) {
  return (
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
  )
}

const TONES = {
  ar: {
    box: 'bg-purple-500/20 border-purple-500/30',
    Icon: CheckCircle,
    iconClass: 'h-5 w-5 text-purple-500 dark:text-purple-400 mt-0.5',
    titleClass: 'text-purple-700 dark:text-purple-300',
    textClass: 'text-purple-600 dark:text-purple-400',
    title: 'AR Mode Active',
    describe: (arMode: ArMode | null) => `AR camera ready with ${arMode?.toUpperCase()}`,
  },
  limited: {
    box: 'bg-amber-500/20 border-amber-500/30',
    Icon: AlertCircle,
    iconClass: 'h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5',
    titleClass: 'text-amber-700 dark:text-amber-300',
    textClass: 'text-amber-600 dark:text-amber-400',
    title: 'AR Limited',
    describe: () => 'Limited AR support - try mobile device',
  },
  threeD: {
    box: 'bg-blue-500/20 border-blue-500/30',
    Icon: CheckCircle,
    iconClass: 'h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5',
    titleClass: 'text-blue-700 dark:text-blue-300',
    textClass: 'text-blue-600 dark:text-blue-400',
    title: '3D Mode Active',
    describe: () => 'Interactive 3D model with full controls',
  },
}

interface ModeInfoProps {
  viewMode: ViewMode
  isARSupported: boolean
  arMode: ArMode | null
  showControls: boolean
}

/** Mode Info (desktop) */
export function ModeInfo({ viewMode, isARSupported, arMode, showControls }: ModeInfoProps) {
  const arReady = isARSupported || arMode
  const tone = viewMode === 'ar' ? (arReady ? TONES.ar : TONES.limited) : TONES.threeD
  return (
    <div className={`hidden lg:block absolute bottom-8 left-6 z-20 transition-all duration-300 ${
      showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className={`rounded-2xl p-4 backdrop-blur-xl border shadow-2xl max-w-xs ${tone.box}`}>
        <div className="flex items-start gap-3">
          <tone.Icon className={tone.iconClass} />
          <div>
            <p className={`font-semibold text-sm ${tone.titleClass}`}>
              {tone.title}
            </p>
            <p className={`text-xs mt-1 ${tone.textClass}`}>
              {tone.describe(arMode)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Show controls hint */
export function ControlsHint() {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-card/80 backdrop-blur-xl rounded-full px-4 py-2 border border-border">
        <p className="text-muted-foreground text-xs flex items-center gap-2">
          <Eye className="h-3 w-3" />
          Touch or move mouse to show controls
        </p>
      </div>
    </div>
  )
}
