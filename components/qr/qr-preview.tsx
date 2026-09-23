'use client'

// The interactive parts of the QR dialog: the code at two sizes, the menu URL with copy and
// preview, and the three actions (download, share, preview).
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { CheckCircle, CheckCircle2, Copy, Download, Eye, Globe, Share2 } from 'lucide-react'
import { QR_SIZES, qrCodeUrl } from '@/components/qr/qr-urls'

export type PreviewMode = 'small' | 'large'

interface QrSizePreviewProps {
  url: string
  restaurantName: string
  previewMode: PreviewMode
  onChange: (mode: PreviewMode) => void
}

/**
 * The QR dialog's code preview with a Small/Large switch; the caller holds the mode, and the large
 * one is fetched at the 600px size.
 */
export function QrSizePreview({ url, restaurantName, previewMode, onChange }: QrSizePreviewProps) {
  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center gap-2 mb-4">
        <Button
          variant={previewMode === 'small' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange('small')}
          className={previewMode === 'small' ? 'bg-primary' : ''}
        >
          Small
        </Button>
        <Button
          variant={previewMode === 'large' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange('large')}
          className={previewMode === 'large' ? 'bg-primary' : ''}
        >
          Large
        </Button>
      </div>

      <div className="relative inline-block">
        <div className="bg-card p-6 rounded-lg border-4 border-border">
          <Image
            src={previewMode === 'large' ? qrCodeUrl(url, QR_SIZES.large) : qrCodeUrl(url, QR_SIZES.card)}
            alt={`QR Code for ${restaurantName} digital menu`}
            width={previewMode === 'large' ? 400 : 300}
            height={previewMode === 'large' ? 400 : 300}
            className={`${previewMode === 'large' ? 'w-80 h-80' : 'w-60 h-60'} transition-colors`}
          />
        </div>
        {/* Corner decoration */}
        <div className="absolute -top-3 -right-3 rounded-full p-2">
          <CheckCircle2 className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  )
}

interface MenuUrlPanelProps {
  url: string
  copied: boolean
  onCopy: () => void
  onPreview: () => void
}

/**
 * The menu URL as text, with a copy button and a Preview link; shows a confirmation while `copied`
 * is true, which the caller clears.
 */
export function MenuUrlPanel({ url, copied, onCopy, onPreview }: MenuUrlPanelProps) {
  return (
    <div className="p-4 border border-border rounded-md">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Menu URL
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreview}
          className="text-muted-foreground hover:text-muted-foreground hover:bg-muted"
        >
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 p-3 bg-background border-2 border-border rounded-lg text-sm text-foreground break-all font-mono">
          {url}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          className={`transition-colors ${
 copied
 ? "border-border text-success bg-muted"
 : "border-border hover:border-border hover:bg-muted"
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
        <div className="flex items-center gap-2 mt-2 p-2 bg-muted border border-border rounded-lg">
          <CheckCircle className="h-4 w-4 text-success" />
          <p className="text-sm text-success font-medium">URL copied to clipboard!</p>
        </div>
      )}
    </div>
  )
}

interface QrActionsProps {
  isDownloading: boolean
  onDownload: () => void
  onShare: () => void
  onPreview: () => void
}

/** Enhanced Action Buttons */
export function QrActions({ isDownloading, onDownload, onShare, onPreview }: QrActionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Button
        onClick={onDownload}
        disabled={isDownloading}
        className="text-white transition-colors"
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
        onClick={onShare}
        variant="outline"
        className="border-border text-success hover:bg-muted hover:border-border transition-colors"
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share Menu
      </Button>

      <Button
        onClick={onPreview}
        variant="outline"
        className="border-border text-muted-foreground hover:bg-muted hover:border-border transition-colors"
      >
        <Eye className="h-4 w-4 mr-2" />
        Preview Menu
      </Button>
    </div>
  )
}
