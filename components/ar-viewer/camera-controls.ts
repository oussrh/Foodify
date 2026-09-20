// components/ar-viewer/camera-controls.ts
// The viewer's camera actions on the <model-viewer> element: reset to the default orbit, zoom
// in or out by stepping the orbit radius, and share the page (the Web Share API, or the
// clipboard when it is missing or refuses).
import { toast } from 'sonner'
import type { ModelViewer, ViewMode } from '@/components/model-viewer/element'

const DEFAULT_ORBIT = '45deg 75deg auto'

/** Reset camera view */
export function resetCamera(modelViewer: ModelViewer) {
  modelViewer.resetTurntableRotation()
  if (modelViewer.jumpCameraToGoal) {
    modelViewer.jumpCameraToGoal()
  }
  // Reset to default camera orbit
  modelViewer.setAttribute('camera-orbit', DEFAULT_ORBIT)
  toast.success('View reset')
}

/** The next radius of the orbit: 10% closer or farther, between 50% and 200%, from 100% when it is auto. */
function steppedDistance(distance: string, direction: 'in' | 'out') {
  if (distance === 'auto' || distance === '100%') return direction === 'in' ? '80%' : '120%'
  return direction === 'in' ? `${Math.max(50, parseInt(distance) - 10)}%` : `${Math.min(200, parseInt(distance) + 10)}%`
}

export function zoomCamera(modelViewer: ModelViewer, direction: 'in' | 'out') {
  const currentOrbit = modelViewer.getAttribute('camera-orbit') || DEFAULT_ORBIT
  const parts = currentOrbit.split(' ')
  const distance = parts[2] === 'auto' ? '100%' : parts[2]
  modelViewer.setAttribute('camera-orbit', `${parts[0]} ${parts[1]} ${steppedDistance(distance, direction)}`)
  toast.success(direction === 'in' ? 'Zoomed in' : 'Zoomed out')
}

/** Share model */
export async function shareViewer(dishName: string, viewMode: ViewMode) {
  const modeLabel = viewMode === 'ar' ? 'AR' : '3D'
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${dishName} - ${modeLabel} Model`,
        text: `Check out this interactive ${modeLabel} model of ${dishName}!`,
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
