'use client'

// The AR the device can open, detected once on mount (ar-support.ts); false and null until
// the check answers.
import { useEffect, useState } from 'react'
import { detectArSupport } from '@/components/ar-viewer/ar-support'
import type { ArMode } from '@/components/model-viewer/element'

export function useArSupport() {
  const [isARSupported, setIsARSupported] = useState(false)
  const [arMode, setArMode] = useState<ArMode | null>(null)

  useEffect(() => {
    detectArSupport().then(({ supported, mode }) => {
      setIsARSupported(supported)
      setArMode(mode)
    })
  }, [])

  return { isARSupported, arMode }
}
