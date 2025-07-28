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
import { QrCode, Copy, CheckCircle, Share2, Download } from 'lucide-react'
import Image from 'next/image'

interface FloatingQRButtonProps {
  url: string
  restaurantName: string
}

export default function FloatingQRButton({ url, restaurantName }: FloatingQRButtonProps) {
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
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 rounded-full w-16 h-16 p-0"
        >
          <QrCode className="h-8 w-8" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold">
            📱 QR Code Menu
          </DialogTitle>
          <p className="text-center text-sm text-gray-600">
            {restaurantName}
          </p>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-2xl shadow-lg border-2 border-purple-100">
            <Image
              src={qrCodeUrl}
              alt={`QR Code for ${restaurantName}`}
              width={160}
              height={160}
              className="w-40 h-40 mx-auto"
            />
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-700 font-medium">
              👆 Show this to customers
            </p>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                They&apos;ll see the full AR menu with 3D dish previews!
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied!' : 'Copy'}
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
              size="sm"
              className="flex items-center gap-1 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Share2 className="h-3 w-3" />
              Share
            </Button>
          </div>
          
          <div className="w-full">
            <p className="text-xs text-gray-500 mb-1">Direct link:</p>
            <div className="bg-gray-50 px-3 py-2 rounded-lg border text-xs text-gray-600 font-mono break-all">
              {url}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}