// PathFile: components/qr-code-display.tsx
"use client"

import { useState, useCallback } from 'react'
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
  QrCode, 
  Download,
  Share2,
  Copy,
  CheckCircle,
  Smartphone,
  Camera,
  ExternalLink,
  Eye,
  Zap,
  Users,
  Globe,
  Printer,
  Mail,
  MessageSquare,
  Star,
  Sparkles,
  CheckCircle2,
  Info
} from 'lucide-react'
import Image from 'next/image'

interface QRCodeDisplayProps {
  url: string
  restaurantName: string
}

export default function QRCodeDisplay({ url, restaurantName }: QRCodeDisplayProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [previewMode, setPreviewMode] = useState<'small' | 'large'>('small')
  
  // Generate QR code URL using a QR code service with enhanced styling
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=4f46e5&bgcolor=ffffff&qzone=2&format=png`
  const qrCodeLargeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(url)}&color=4f46e5&bgcolor=ffffff&qzone=2&format=png`
  const qrCodeDownloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&data=${encodeURIComponent(url)}&color=4f46e5&bgcolor=ffffff&qzone=2&format=png`

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }, [url])

  const downloadQRCode = useCallback(async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(qrCodeDownloadUrl)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${restaurantName.replace(/\s+/g, '_')}_QR_Menu_HD.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('Download failed:', err)
      // Fallback to direct link
      const link = document.createElement('a')
      link.href = qrCodeDownloadUrl
      link.download = `${restaurantName.replace(/\s+/g, '_')}_QR_Menu_HD.png`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally {
      setIsDownloading(false)
    }
  }, [qrCodeDownloadUrl, restaurantName])

  const shareMenu = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${restaurantName} - Digital Menu`,
          text: `Check out the digital menu for ${restaurantName} with AR experience!`,
          url: url,
        })
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error sharing:', err)
          // Fallback to copying URL
          copyToClipboard()
        }
      }
    } else {
      // Fallback to copying URL
      copyToClipboard()
    }
  }, [url, restaurantName, copyToClipboard])

  const openMenuPreview = () => {
    window.open(url, '_blank', 'width=400,height=700,scrollbars=yes,resizable=yes')
  }

  return (
    <>
      {/* Main QR Code Display */}
      <div className="text-center space-y-3">
        <div className="relative group">
          <div className="bg-white p-4 rounded-2xl shadow-2xl inline-block ring-4 ring-white/20 transition-all duration-300 group-hover:shadow-3xl group-hover:scale-105">
            <div className="relative">
              <Image
                src={qrCodeUrl}
                alt={`QR Code for ${restaurantName} digital menu`}
                width={128}
                height={128}
                className="w-24 h-24 lg:w-32 lg:h-32 transition-transform duration-300"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
          {/* Floating badge */}
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-2 shadow-lg">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-white/90 text-sm font-medium">Scan for Digital Menu</p>
          <Badge className="bg-white/20 text-white border-white/30 text-xs">
            <Camera className="h-3 w-3 mr-1" />
            AR Experience Included
          </Badge>
        </div>
      </div>

      {/* Enhanced QR Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-3 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <QrCode className="h-4 w-4 mr-2" />
            QR Details
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
              <QrCode className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              QR Code Menu
            </DialogTitle>
            <p className="text-gray-600">{restaurantName}</p>
          </DialogHeader>
          
          <div className="space-y-8 mt-6">
            {/* QR Code Display with Toggle */}
            <div className="text-center space-y-4">
              <div className="flex justify-center gap-2 mb-4">
                <Button
                  variant={previewMode === 'small' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('small')}
                  className={previewMode === 'small' ? 'bg-purple-600' : ''}
                >
                  Small
                </Button>
                <Button
                  variant={previewMode === 'large' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('large')}
                  className={previewMode === 'large' ? 'bg-purple-600' : ''}
                >
                  Large
                </Button>
              </div>
              
              <div className="relative inline-block">
                <div className="bg-white p-6 rounded-2xl shadow-2xl border-4 border-gray-100">
                  <Image
                    src={previewMode === 'large' ? qrCodeLargeUrl : qrCodeUrl}
                    alt={`QR Code for ${restaurantName} digital menu`}
                    width={previewMode === 'large' ? 400 : 300}
                    height={previewMode === 'large' ? 400 : 300}
                    className={`${previewMode === 'large' ? 'w-80 h-80' : 'w-60 h-60'} transition-all duration-300`}
                  />
                </div>
                {/* Corner decoration */}
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full p-2 shadow-lg">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            
            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Customer Experience
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-purple-700">
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile-optimized digital menu</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-purple-700">
                    <Camera className="h-4 w-4" />
                    <span>Interactive AR dish visualization</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-purple-700">
                    <Zap className="h-4 w-4" />
                    <span>Real-time menu updates</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Business Benefits
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Globe className="h-4 w-4" />
                    <span>Contactless menu access</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>Instant menu updates</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Eye className="h-4 w-4" />
                    <span>Enhanced customer engagement</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* URL Display */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Menu URL
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openMenuPreview}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-800 break-all font-mono">
                  {url}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className={`transition-all duration-200 ${
                    copied 
                      ? "border-green-200 text-green-600 bg-green-50" 
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copied && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-700 font-medium">URL copied to clipboard!</p>
                </div>
              )}
            </div>
            
            {/* Enhanced Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                onClick={downloadQRCode}
                disabled={isDownloading}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isDownloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download HD QR
                  </>
                )}
              </Button>
              
              <Button
                onClick={shareMenu}
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Menu
              </Button>
              
              <Button
                onClick={openMenuPreview}
                variant="outline"
                className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Menu
              </Button>
            </div>
            
            {/* Enhanced Instructions */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Setup Instructions
                </h4>
                <ol className="text-sm text-blue-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Download the HD QR code</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Print and place on tables or entrance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Customers scan to access digital menu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <span>They can explore dishes in AR</span>
                  </li>
                </ol>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Marketing Tips
                </h4>
                <ul className="text-sm text-green-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Add &ldquo;Scan for AR Menu&rdquo; signage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Include QR in social media posts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Highlight AR features to customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Train staff on digital menu benefits</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Technical Info */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Technical Information
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Format:</span>
                  <br />
                  <span>PNG High Quality</span>
                </div>
                <div>
                  <span className="font-medium">Size:</span>
                  <br />
                  <span>1200×1200 pixels</span>
                </div>
                <div>
                  <span className="font-medium">Error Correction:</span>
                  <br />
                  <span>Medium Level</span>
                </div>
                <div>
                  <span className="font-medium">Compatibility:</span>
                  <br />
                  <span>All QR scanners</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
