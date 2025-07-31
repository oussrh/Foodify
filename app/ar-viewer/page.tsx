import { Suspense } from 'react'
import { Metadata, Viewport } from 'next'
import ARViewerClient from '@/components/ar-viewer-client'

export const metadata: Metadata = {
  title: 'AR Viewer - Foodify',
  description: 'Interactive AR food experience',
  robots: 'noindex, nofollow',
  other: {
    'format-detection': 'telephone=no',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function ARViewerPage() {
  return (
    <>
      {/* Enhanced mobile AR experience with proper meta tags */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content="#000000" />
      
      <div className="min-h-screen bg-black relative overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p>Loading AR Experience...</p>
              <p className="text-sm text-gray-400 mt-2">Preparing camera access...</p>
            </div>
          </div>
        }>
          <ARViewerClient />
        </Suspense>
      </div>
    </>
  )
}