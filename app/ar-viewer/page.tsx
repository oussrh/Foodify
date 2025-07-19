import { Suspense } from 'react'
import ARViewerClient from '@/components/ar-viewer-client'

export default function ARViewerPage() {
  return (
    <div className="min-h-screen bg-black">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p>Loading AR Experience...</p>
          </div>
        </div>
      }>
        <ARViewerClient />
      </Suspense>
    </div>
  )
}