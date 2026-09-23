'use client'

// Whether the document is fullscreen, and the toggle; shared by the AR and 3D viewer pages.
import { useEffect, useState } from 'react'

/**
 * Whether the document is fullscreen, and a toggle for the whole page; used by the AR and 3D viewer
 * pages. Failures are logged, not thrown.
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  return { isFullscreen, toggleFullscreen }
}
