// PathFile: components/qr-code-display.tsx
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
import { QrCode, Camera, ExternalLink, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { QR_SIZES, qrCodeUrl } from '@/components/qr/qr-urls'
import { useQrActions } from '@/components/qr/use-qr-actions'
import { MenuUrlPanel, QrActions, QrSizePreview, type PreviewMode } from '@/components/qr/qr-preview'
import { FeaturesGrid, InstructionsGrid, TechnicalInfo } from '@/components/qr/qr-guides'

interface QRCodeDisplayProps {
  url: string
  restaurantName: string
}

export default function QRCodeDisplay({ url, restaurantName }: QRCodeDisplayProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('small')
  const { copied, isDownloading, copyToClipboard, downloadQRCode, shareMenu, openMenuPreview } = useQrActions(url, restaurantName)

  // Generate QR code URL using a QR code service with enhanced styling
  const qrCodeCardUrl = qrCodeUrl(url, QR_SIZES.card)

  return (
    <>
      {/* Main QR Code Display */}
      <div className="text-center space-y-3">
        <div className="relative group">
          <div className="bg-card p-4 rounded-lg inline-block ring-4 ring-white/20 transition-colors group-hover:shadow-3xl">
            <div className="relative">
              <Image
                src={qrCodeCardUrl}
                alt={`QR Code for ${restaurantName} digital menu`}
                width={128}
                height={128}
                className="w-24 h-24 lg:w-32 lg:h-32 transition-transform duration-300"
                priority
              />
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
          {/* Floating badge */}
          <div className="absolute -top-2 -right-2 rounded-full p-2">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-foreground text-sm font-medium">Scan for Digital Menu</p>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
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
            className="mt-3 bg-background/50 border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <QrCode className="h-4 w-4 mr-2" />
            QR Details
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
              <QrCode className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              QR Code Menu
            </DialogTitle>
            <p className="text-muted-foreground">{restaurantName}</p>
          </DialogHeader>

          <div className="space-y-8 mt-6">
            <QrSizePreview url={url} restaurantName={restaurantName} previewMode={previewMode} onChange={setPreviewMode} />
            <FeaturesGrid />
            <MenuUrlPanel url={url} copied={copied} onCopy={copyToClipboard} onPreview={openMenuPreview} />
            <QrActions isDownloading={isDownloading} onDownload={downloadQRCode} onShare={shareMenu} onPreview={openMenuPreview} />
            <InstructionsGrid />
            <TechnicalInfo />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
