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
  QrCode, 
  Download,
  Share2,
  Copy,
  CheckCircle,
  Smartphone,
  Camera
} from 'lucide-react'

interface QRCodeDisplayProps {
  url: string
  restaurantName: string
}

export default function QRCodeDisplay({ url, restaurantName }: QRCodeDisplayProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Generate QR code URL using a QR code service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=4f46e5&bgcolor=ffffff&qzone=2`
  const qrCodeDownloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(url)}&color=4f46e5&bgcolor=ffffff&qzone=2`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const downloadQRCode = () => {
    const link = document.createElement('a')
    link.href = qrCodeDownloadUrl
    link.download = `${restaurantName.replace(/\s+/g, '_')}_QR_Menu.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shareMenu = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${restaurantName} - Digital Menu`,
          text: `Check out the digital menu for ${restaurantName} with AR experience!`,
          url: url,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      // Fallback to copying URL
      copyToClipboard()
    }
  }

  return (
    <>
      {/* Main QR Code Display */}
      <div className="text-center">
        <div className="bg-white p-4 rounded-2xl shadow-2xl inline-block">
          <img
            src={qrCodeUrl}
            alt={`QR Code for ${restaurantName}`}
            className="w-24 h-24 lg:w-32 lg:h-32"
          />
        </div>
        <p className="text-white/90 text-sm mt-2">Scan for menu</p>
      </div>

      {/* Detailed QR Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <QrCode className="h-4 w-4 mr-2" />
            QR Details
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-purple-600" />
              QR Code Menu - {restaurantName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Large QR Code */}
            <div className="text-center">
              <div className="bg-white p-6 rounded-2xl shadow-lg inline-block border">
                <img
                  src={qrCodeUrl}
                  alt={`QR Code for ${restaurantName}`}
                  className="w-48 h-48"
                />
              </div>
            </div>
            
            {/* Features */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">What customers get:</h4>
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
                  <CheckCircle className="h-4 w-4" />
                  <span>Real-time menu updates</span>
                </div>
              </div>
            </div>
            
            {/* URL Display */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Menu URL:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-white border rounded text-sm text-gray-800 truncate">
                  {url}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className={copied ? "border-green-200 text-green-600" : ""}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-green-600 mt-1">URL copied to clipboard!</p>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={downloadQRCode}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR
              </Button>
              <Button
                onClick={shareMenu}
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Menu
              </Button>
            </div>
            
            {/* Instructions */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">For restaurant staff:</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Download and print the QR code</li>
                <li>2. Place on tables or at entrance</li>
                <li>3. Customers scan to access the digital menu</li>
                <li>4. They can view dishes in AR for better ordering decisions</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}