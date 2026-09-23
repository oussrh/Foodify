'use client'

// The USDZ side of the preview: no viewer in the browser, so what the file is for and a
// download.
import { Button } from '@/components/ui/button'
import { Camera, Download, Info } from 'lucide-react'

/**
 * The USDZ side of the preview dialog. There is no in-browser viewer for the format, so it explains
 * where the file opens and offers a download.
 */
export function UsdzPane({ onDownload }: { onDownload: () => void }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="w-24 h-24 rounded-lg flex items-center justify-center mx-auto">
          <Camera className="h-12 w-12 text-white" />
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-foreground">USDZ Model Ready</h3>
          <p className="text-muted-foreground leading-relaxed">
            This USDZ file is optimized for iOS devices with ARKit support.
            Open with iOS Safari or compatible apps to view in augmented reality.
          </p>
        </div>

        <div className="p-4 bg-muted border border-border rounded-md">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground dark:text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-muted-foreground mb-1">AR Quick Look Compatible</p>
              <p className="text-muted-foreground dark:text-muted-foreground">
                Works on iPhone 6s and later, iPad (5th generation) and later
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onDownload}
            className="w-full h-12 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Download USDZ File
          </Button>
          <p className="text-sm text-muted-foreground">
            Optimized for AR
          </p>
        </div>
      </div>
    </div>
  )
}
