"use client"

import { useState, useEffect } from 'react'
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
  Loader2,
  AlertCircle,
  CheckCircle,
  Apple,
  Globe,
  Cube,
  Eye,
  Monitor
} from 'lucide-react'

interface SimpleARCameraProps {
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

export default function SimpleARCamera({ dish, restaurantId, locale }: SimpleARCameraProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState({
    isIOS: false,
    isAndroid: false,
    isMobile: false,
    browserSupport: 'unknown'
  })
  
  const dishName = locale === 'fr' ? dish.nameFr : dish.nameEn
  const hasARModel = dish.usdzUrl || dish.glbUrl
  
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent
      const isIOS = /iPhone|iPad|iPod/i.test(userAgent)
      const isAndroid = /Android/i.test(userAgent)
      const isMobile = isIOS || isAndroid
      
      let browserSupport = 'limited'
      if (isIOS && 'DocumentPictureInPicture' in window) {
        browserSupport = 'full'
      } else if ('xr' in navigator) {
        browserSupport = 'webxr'
      } else if (isAndroid) {
        browserSupport = 'scene-viewer'
      }
      
      setDeviceInfo({ isIOS, isAndroid, isMobile, browserSupport })
    }
  }, [])
  
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
          deviceType: deviceInfo.isIOS ? 'iOS' : 
                     deviceInfo.isAndroid ? 'Android' : 'Other',
          browserSupport: deviceInfo.browserSupport
        }),
      })
    } catch (error) {
      console.error('Failed to record AR view:', error)
    }
  }

  const launch3DViewer = async () => {
    setIsLoading(true)
    
    // Record the view
    await recordARView()
    
    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (dish.glbUrl) {
      // Open in 3D mode by default
      window.open(`/ar-viewer?model=${encodeURIComponent(dish.glbUrl)}&name=${encodeURIComponent(dishName)}&mode=3d`, '_blank')
    }
    
    setIsLoading(false)
    setIsOpen(false)
  }

  const launchARExperience = async () => {
    setIsLoading(true)
    
    // Record the AR view
    await recordARView()
    
    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (deviceInfo.isIOS && dish.usdzUrl) {
      // iOS devices use USDZ files with AR Quick Look - this opens the native camera
      const link = document.createElement('a')
      link.href = dish.usdzUrl
      link.setAttribute('rel', 'ar')
      // Add AR Quick Look attributes for better camera integration
      link.setAttribute('data-ar', 'true')
      link.setAttribute('data-ar-scale', 'true')
      link.setAttribute('data-ar-placement', 'floor')
      document.body.appendChild(link)
      
      // Force click to trigger AR Quick Look camera
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      })
      link.dispatchEvent(clickEvent)
      
      // Clean up
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link)
        }
      }, 1000)
      
    } else if (deviceInfo.isAndroid && dish.glbUrl) {
      // Android devices - use scene-viewer intent which opens native AR camera
      const sceneViewerUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(dish.glbUrl)}&mode=ar_preferred&title=${encodeURIComponent(dishName)}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(window.location.origin + '/ar-viewer?model=' + encodeURIComponent(dish.glbUrl) + '&name=' + encodeURIComponent(dishName) + '&mode=ar')};end;`
      
      // Try to launch native AR first
      window.location.href = sceneViewerUrl
      
      // Fallback to web AR viewer after a delay if native doesn't work
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          window.open(`/ar-viewer?model=${encodeURIComponent(dish.glbUrl || '')}&name=${encodeURIComponent(dishName)}&mode=ar`, '_blank')
        }
      }, 2000)
      
    } else if (dish.glbUrl) {
      // Desktop or other devices - use WebXR/model-viewer in AR mode
      window.open(`/ar-viewer?model=${encodeURIComponent(dish.glbUrl)}&name=${encodeURIComponent(dishName)}&mode=ar`, '_blank')
    }
    
    setIsLoading(false)
    setIsOpen(false)
  }

  const supportsAR = (deviceInfo.isIOS && dish.usdzUrl) || dish.glbUrl

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Camera className="h-5 w-5 mr-3" />
          Open AR Camera
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
            <Camera className="h-6 w-6 text-purple-600" />
            AR Camera Ready
          </DialogTitle>
          <p className="text-center text-gray-600">
            {dishName}
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Device Status */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Device Compatibility</h3>
            
            {deviceInfo.isIOS && dish.usdzUrl && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <Apple className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">iOS AR Quick Look</span>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              </div>
            )}
            
            {deviceInfo.isAndroid && dish.glbUrl && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Android Scene Viewer</span>
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              </div>
            )}
            
            {!deviceInfo.isMobile && dish.glbUrl && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">WebXR Viewer</span>
                </div>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Available
                </Badge>
              </div>
            )}
            
            {!supportsAR && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">Limited AR support on this device</span>
              </div>
            )}
          </div>
          
          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">How to use:</h4>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Tap &ldquo;Launch AR&rdquo; below</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Point your camera at a flat surface (table, floor)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Tap to place the 3D dish and explore!</span>
              </li>
            </ol>
          </div>
          
          {/* Launch Button */}
          <Button 
            onClick={launchARExperience}
            disabled={!supportsAR || isLoading}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Opening AR Camera...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                <span>Launch AR Experience</span>
              </div>
            )}
          </Button>
          
          {!supportsAR && (
            <div className="text-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 font-medium">AR camera requires a compatible device</p>
              <p className="text-xs text-amber-600 mt-1">Try on a mobile device for the best experience</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}