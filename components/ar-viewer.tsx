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
  Eye, 
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  Apple,
  Monitor,
  Globe,
  Zap,
  Play,
  Share2,
  Star,
  Users,
  Target,
  Sparkles
} from 'lucide-react'
import Image from 'next/image'

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
      setViewRecorded(true)
    } catch (error) {
      console.error('Failed to record AR view:', error)
    }
  }

  const handleARView = async () => {
    setIsLoading(true)
    
    // Record the AR view
    await recordARView()
    
    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (deviceInfo.isIOS && dish.usdzUrl) {
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

  const shareARExperience = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${dishName} - AR Experience`,
          text: `Check out this dish in augmented reality!`,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Share cancelled or failed:', err)
      }
    } else {
      navigator.clipboard?.writeText(window.location.href)
    }
  }

  const supportsAR = (deviceInfo.isIOS && dish.usdzUrl) || dish.glbUrl
  const arQuality = deviceInfo.isIOS && dish.usdzUrl ? 'high' : 
                   deviceInfo.browserSupport === 'webxr' ? 'high' : 'good'

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-purple-600 hover:via-pink-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-white/20"
          size="sm"
        >
          <Camera className="h-4 w-4 mr-2" />
          <span>View in AR</span>
          <Sparkles className="h-3 w-3 ml-1" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-lg border-0 shadow-2xl">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Camera className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            AR Experience
          </DialogTitle>
          <p className="text-gray-600">{dishName}</p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* AR Preview */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100 shadow-inner">
            <Image
              src={dish.imageUrl}
              alt={dishName}
              fill
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-600/40 via-transparent to-transparent">
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Play className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-gray-900">Ready for AR</span>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                      3D Model
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Device Compatibility */}
          <div className="grid gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Info className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    Device Compatibility
                  </p>
                  <div className="space-y-2">
                    {deviceInfo.isIOS && dish.usdzUrl && (
                      <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-blue-800">
                          <Apple className="h-4 w-4" />
                          <span>iOS AR Quick Look</span>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Supported
                        </Badge>
                      </div>
                    )}
                    {dish.glbUrl && (
                      <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-blue-800">
                          <Globe className="h-4 w-4" />
                          <span>WebXR Compatible</span>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Available
                        </Badge>
                      </div>
                    )}
                    {!supportsAR && (
                      <div className="flex items-center gap-2 text-sm text-amber-700 p-2 bg-amber-100/60 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        <span>Limited AR support on this device</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AR Quality Indicator */}
            {supportsAR && (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">AR Quality</span>
                </div>
                <Badge className={`text-xs ${
                  arQuality === 'high' 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                }`}>
                  {arQuality === 'high' ? 'High Quality' : 'Good Quality'}
                </Badge>
              </div>
            )}
          </div>
          
          {/* Instructions */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              How to use AR
            </h4>
            <ol className="space-y-2">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span className="text-sm text-gray-700">Tap &ldquo;Launch AR Experience&rdquo; below</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span className="text-sm text-gray-700">Point your camera at a flat surface (like your table)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span className="text-sm text-gray-700">Tap to place the 3D model and explore!</span>
              </li>
            </ol>
          </div>
          
          {/* AR Launch Button */}
          <div className="space-y-4">
            <Button 
              onClick={handleARView}
              disabled={!supportsAR || isLoading}
              className="w-full h-14 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-purple-600 hover:via-pink-600 hover:to-indigo-600 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Launching AR Experience...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Camera className="h-5 w-5" />
                  <span>Launch AR Experience</span>
                  <Sparkles className="h-4 w-4" />
                </div>
              )}
            </Button>
            
            {!supportsAR && (
              <div className="text-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">AR experience requires a compatible device</p>
                <p className="text-xs text-amber-600 mt-1">Try the 3D viewer below as an alternative</p>
              </div>
            )}
          </div>
          
          {/* Alternative Options */}
          {dish.glbUrl && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">Alternative Options</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareARExperience}
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (dish.glbUrl) {
                      window.open(
                        `/3d-viewer?model=${encodeURIComponent(dish.glbUrl)}&name=${encodeURIComponent(dishName)}`,
                        '_blank'
                      )
                    }
                  }}
                  className="flex items-center gap-2 border-gray-200 hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4" />
                  <span>3D Viewer</span>
                </Button>
                {dish.usdzUrl && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!dish.usdzUrl) return // Double security for TypeScript
                      const link = document.createElement('a')
                      link.href = dish.usdzUrl
                      link.download = `${dishName.replace(/\s+/g, '_')}.usdz`
                      link.click()
                    }}
                    className="flex items-center gap-2 border-gray-200 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Success Message */}
          {viewRecorded && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">AR Experience Recorded!</p>
                  <p className="text-xs text-green-600 mt-1">Thank you for trying our augmented reality feature. Your interaction helps us improve the experience.</p>
                </div>
              </div>
            </div>
          )}

          {/* Feature Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Users className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-xs text-purple-700 font-medium">Interactive</p>
            </div>
            <div className="text-center p-3 bg-pink-50 rounded-lg">
              <Star className="h-5 w-5 text-pink-600 mx-auto mb-1" />
              <p className="text-xs text-pink-700 font-medium">High Quality</p>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <Zap className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-xs text-indigo-700 font-medium">Immersive</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
