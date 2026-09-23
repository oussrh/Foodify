'use client'

// An inline 3D view of a dish's GLB model on the public dish page, locked to horizontal spin:
// the polar (up/down) orbit is pinned at eye level, so a guest can turn the dish left and right
// but not tip it over; pan and zoom are off. The <model-viewer> script loads once, on demand
// (only when a guest opens the 3D view), and the element is built imperatively so TSX needs no
// custom-element typing.
import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { MODEL_VIEWER_SCRIPT_SRC } from '@/components/model-viewer/element'

/** Resolves once the <model-viewer> custom element is defined; loads its script once for the page. */
function loadModelViewer(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (customElements.get('model-viewer')) return Promise.resolve()
  const existing = document.querySelector<HTMLScriptElement>('script[data-model-viewer]')
  if (!existing) {
    const script = document.createElement('script')
    script.type = 'module'
    script.src = MODEL_VIEWER_SCRIPT_SRC
    script.dataset.modelViewer = 'true'
    document.head.appendChild(script)
  }
  return customElements.whenDefined('model-viewer').then(() => undefined)
}

/**
 * A dish's GLB model, turned left and right only, pinned at eye level; the model-viewer script
 * loads the first time a guest opens the 3D view.
 */
export default function Dish3D({ glbUrl, name }: { glbUrl: string; name: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadModelViewer().then(
      () => {
        if (cancelled || !containerRef.current) return
        const el = document.createElement('model-viewer')
        el.setAttribute('src', glbUrl)
        el.setAttribute('alt', `3D model of ${name}`)
        el.setAttribute('camera-controls', '')
        el.setAttribute('auto-rotate', '')
        el.setAttribute('interaction-prompt', 'none')
        el.setAttribute('disable-pan', '')
        el.setAttribute('disable-zoom', '')
        // Pin the vertical orbit at the horizon so only the horizontal angle can change.
        el.setAttribute('min-camera-orbit', 'auto 90deg auto')
        el.setAttribute('max-camera-orbit', 'auto 90deg auto')
        el.setAttribute('shadow-intensity', '1')
        el.setAttribute('touch-action', 'pan-y')
        el.style.width = '100%'
        el.style.height = '100%'
        el.style.backgroundColor = 'transparent'
        containerRef.current.replaceChildren(el)
        setReady(true)
      },
      () => {
        if (!cancelled) setFailed(true)
      },
    )
    return () => {
      cancelled = true
    }
  }, [glbUrl, name])

  return (
    <div className="relative h-full w-full">
      {/* React never renders children into this div; the model-viewer element is appended by hand. */}
      <div ref={containerRef} className="h-full w-full" />
      {!ready && !failed && (
        <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading the 3D model</span>
        </span>
      )}
      {failed && <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-muted-foreground">The 3D model could not be loaded.</span>}
    </div>
  )
}
