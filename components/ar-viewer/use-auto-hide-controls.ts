'use client'

// The viewer's controls show on any mouse move or touch and hide again after a pause.
import { useCallback, useEffect, useRef, useState } from 'react'

export function useAutoHideControls(hideAfterMs: number) {
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-hide controls after inactivity
  const armControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), hideAfterMs)
  }, [hideAfterMs])
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    armControlsTimer()
  }, [armControlsTimer])

  useEffect(() => {
    // Mouse movement listener for auto-hide controls
    const handleMouseMove = () => resetControlsTimer()
    const handleTouchStart = () => resetControlsTimer()
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('touchstart', handleTouchStart)

    // Controls start visible; only the hide timer needs arming.
    armControlsTimer()

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('touchstart', handleTouchStart)
    }
  }, [resetControlsTimer, armControlsTimer])

  const hideControls = () => setShowControls(false)

  return { showControls, hideControls }
}
