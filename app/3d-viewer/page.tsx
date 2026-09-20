import { Suspense } from 'react'
import ThreeDViewerClient from '@/components/3d-viewer-client'

export default function ThreeDViewerPage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-border-strong mx-auto mb-4"></div>
            <p>Loading 3D Viewer...</p>
          </div>
        </div>
      }>
        <ThreeDViewerClient />
      </Suspense>
    </div>
  )
}