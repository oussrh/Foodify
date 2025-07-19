"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Camera, 
  Smartphone, 
  Eye, 
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'

interface ARViewerProps {
  dish: {
    id: string
    nameEn: string
    nameFr: string
    usdzUrl?: string
    glbUrl?: string
    imageUrl: string
  }
  restaurantId: string
  locale: string
}

export default function ARViewer({ dish, restaurantId, locale }: ARViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [viewRecorded, setViewRecorded] = useState(false)
  
  const dishName = locale === 'fr' ? dish.nameFr : dish.nameEn
  const hasARModel = dish.usdzUrl || dish.glbUrl
  
  if (!hasARModel) {
    return null
  }

  const recordARView = async () => {
    try {
      await fetch('/api/dish-views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dishId: dish.id,
          arViewed: true,
          deviceType: /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'iOS' : 
                     /Android/i.test(navigator.userAgent) ? 'Android' : 'Other'
        }),
      })
      setViewRecorded(true)
    } catch (error) {
      console.error('Failed to record AR view:', error)
    }
  }

  const handleARView = async () => {
    setIsLoading(true)
    
    // Record the AR view
    await recordARView()
    
    // Detect device and launch appropriate AR viewer
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const isAndroid = /Android/i.test(navigator.userAgent)
    
    if (isIOS && dish.usdzUrl) {
      // iOS devices use USDZ files with AR Quick Look
      const link = document.createElement('a')
      link.href = dish.usdzUrl
      link.setAttribute('rel', 'ar')
      link.setAttribute('download', `${dishName.replace(/\s+/g, '_')}.usdz`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else if (dish.glbUrl) {
      // Android and other devices use WebXR or model-viewer
      window.open(`/ar-viewer?model=${encodeURIComponent(dish.glbUrl)}&name=${encodeURIComponent(dishName)}`, '_blank')
    }
    
    setIsLoading(false)
    setIsOpen(false)
  }

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
  const supportsAR = (isIOS && dish.usdzUrl) || dish.glbUrl

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
          size="sm"
        >
          <Camera className="h-4 w-4 mr-2" />
          View in AR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-purple-600" />
            AR Experience: {dishName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* AR Preview */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
            <img
              src={dish.imageUrl}
              alt={dishName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm font-medium">Ready for AR</p>
              </div>
            </div>
          </div>
          
          {/* Device Compatibility */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Device Compatibility
                </p>
                <div className="space-y-1">
                  {isIOS && dish.usdzUrl && (
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <CheckCircle className="h-4 w-4" />
                      <span>iOS AR Quick Look supported</span>
                    </div>
                  )}
                  {dish.glbUrl && (
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <CheckCircle className="h-4 w-4" />
                      <span>WebXR compatible</span>
                    </div>
                  )}
                  {!supportsAR && (
                    <div className="flex items-center gap-2 text-sm text-amber-700">
                      <AlertCircle className="h-4 w-4" />
                      <span>AR not available on this device</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">How to use AR:</h4>
            <ol className="text-sm text-gray-700 space-y-1">
              <li className="flex items-start gap-2">
                <span className="font-medium text-purple-600">1.</span>
                <span>Tap "Launch AR Experience" below</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-purple-600">2.</span>
                <span>Point your camera at a flat surface (like your table)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-purple-600">3.</span>
                <span>Tap to place the 3D model and explore!</span>
              </li>
            </ol>
          </div>
          
          {/* AR Launch Button */}
          <div className="space-y-3">
            <Button 
              onClick={handleARView}
              disabled={!supportsAR || isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading AR...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Launch AR Experience
                </div>
              )}
            </Button>
            
            {!supportsAR && (
              <p className="text-sm text-gray-500 text-center">
                AR experience requires a compatible device and browser
              </p>
            )}
          </div>
          
          {/* Alternative Options */}
          {dish.glbUrl && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Alternative viewing options:</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/3d-viewer?model=${encodeURIComponent(dish.glbUrl)}&name=${encodeURIComponent(dishName)}`, '_blank')}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  3D Viewer
                </Button>
                {dish.usdzUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = dish.usdzUrl
                      link.download = `${dishName.replace(/\s+/g, '_')}.usdz`
                      link.click()
                    }}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {viewRecorded && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span>AR view recorded! Thank you for trying our AR experience.</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}