"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { QrCode, Copy, CheckCircle, Share2 } from 'lucide-react'
import Image from 'next/image'

interface SimpleQRDisplayProps {
  url: string
  restaurantName: string
}

export default function SimpleQRDisplay({ url, restaurantName }: SimpleQRDisplayProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=4f46e5&bgcolor=ffffff&qzone=2&format=png`

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg"
          className="bg-gradient-to-r from-white/95 to-white/90 hover:from-white hover:to-white/95 text-purple-600 border-2 border-white/40 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-semibold"
        >
          <QrCode className="h-5 w-5 mr-3" />
          <div className="flex flex-col items-start">
            <span>Get QR Code</span>
            <span className="text-xs text-purple-500 font-normal">For customer access</span>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            🎯 Customer Access - QR Code Menu
          </DialogTitle>
          <p className="text-center text-gray-600">
            This is how customers will access your AR menu
          </p>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl shadow-lg border-2 border-purple-100">
              <Image
                src={qrCodeUrl}
                alt={`QR Code for ${restaurantName}`}
                width={192}
                height={192}
                className="w-48 h-48 mx-auto"
              />
            </div>
            
            <div className="text-center space-y-3">
              <h3 className="font-semibold text-lg text-gray-800">📱 For Your Customers</h3>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  ✨ What customers will see:
                </p>
                <ul className="text-xs text-blue-700 space-y-1 text-left">
                  <li>• Full digital menu with photos</li>
                  <li>• AR &ldquo;View in AR&rdquo; buttons on each dish</li>
                  <li>• 3D dish visualization on their table</li>
                  <li>• Ingredients, calories, and pricing</li>
                  <li>• Multi-language support</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3 w-full">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="flex-1 flex items-center gap-2 border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${restaurantName} AR Menu`,
                      text: 'Check out our interactive AR menu!',
                      url: url,
                    })
                  }
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
          
          {/* Preview Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-800 text-center">
              📱 Mobile Preview
            </h3>
            
            {/* Mobile mockup */}
            <div className="bg-gray-900 p-2 rounded-2xl shadow-xl mx-auto max-w-xs">
              <div className="bg-white rounded-xl overflow-hidden">
                {/* Phone header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <QrCode className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{restaurantName}</p>
                      <p className="text-xs opacity-90">AR Menu Experience</p>
                    </div>
                  </div>
                </div>
                
                {/* Phone content */}
                <div className="p-3 space-y-3">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-2 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center">
                        🚀
                      </div>
                      <span className="text-purple-700 font-medium">AR Menu Experience</span>
                    </div>
                  </div>
                  
                  {/* Sample dish cards */}
                  <div className="space-y-2">
                    <div className="border rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-800">Grilled Chicken</p>
                          <p className="text-xs text-gray-600">$18.99</p>
                        </div>
                        <Button size="sm" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 h-6 px-2">
                          📷 AR
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-800">Caesar Salad</p>
                          <p className="text-xs text-gray-600">$12.99</p>
                        </div>
                        <Button size="sm" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 h-6 px-2">
                          📷 AR
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-2 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 font-medium">✨ Tap AR buttons to see dishes in 3D!</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <p className="text-sm text-amber-800 font-medium mb-2">
                🎯 Perfect for:
              </p>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Table tents and displays</li>
                <li>• Print on menus and receipts</li>
                <li>• Social media sharing</li>
                <li>• Staff can show customers</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-gray-700">Direct Link:</p>
            <div className="bg-gray-50 px-4 py-2 rounded-lg border">
              <p className="text-xs text-gray-600 font-mono break-all">{url}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}