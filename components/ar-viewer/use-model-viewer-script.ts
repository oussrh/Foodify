'use client'

// Loads the <model-viewer> script once, behind a simulated progress bar (a random step toward
// 90% every 200ms, 100 on load, then the loading screen leaves 300ms later). The script is
// removed with the page.
import { useEffect, useState } from 'react'
import { MODEL_VIEWER_SCRIPT_SRC } from '@/components/model-viewer/element'

/**
 * Adds the <model-viewer> script to the page and reports its load. The progress is simulated and
 * stops at 90% until the script loads; the script is removed on unmount.
 */
export function useModelViewerScript() {
  const [isLoading, setIsLoading] = useState(true)
  const [scriptError, setScriptError] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [modelViewerLoaded, setModelViewerLoaded] = useState(false)

  useEffect(() => {
    // Load model-viewer script
    const script = document.createElement('script')
    script.type = 'module'
    script.src = MODEL_VIEWER_SCRIPT_SRC

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = prev + Math.random() * 15
        return newProgress > 90 ? 90 : newProgress
      })
    }, 200)

    script.onload = () => {
      clearInterval(progressInterval)
      setLoadingProgress(100)
      setModelViewerLoaded(true)
      setTimeout(() => {
        setIsLoading(false)
      }, 300)
    }

    script.onerror = () => {
      clearInterval(progressInterval)
      setScriptError('Failed to load AR viewer. Please check your internet connection.')
      setIsLoading(false)
    }

    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
      clearInterval(progressInterval)
    }
  }, [])

  return { isLoading, scriptError, loadingProgress, modelViewerLoaded }
}
