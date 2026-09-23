'use client'

// The frame of the AR model preview dialog: the header with the dish name, the format badge
// and the close button, and the footer naming what the format is good for.
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, Monitor, Smartphone, X } from 'lucide-react'
import type { ArModelType } from '@/components/upload/targets'

interface PreviewHeaderProps {
  dishName: string
  modelType: ArModelType
  onClose: () => void
}

/** The preview dialog's header: the dish name, the format badge and the close button. */
export function PreviewHeader({ dishName, modelType, onClose }: PreviewHeaderProps) {
  return (
    <DialogHeader className="p-6 pb-4 border-b border-border">
      <div className="flex items-center justify-between">
        <DialogTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span>AR Model Preview</span>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              {dishName}
            </p>
          </div>
        </DialogTitle>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs">
            {modelType === 'usdz' ? (
              <div className="flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                {modelType}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                {modelType}
              </div>
            )}
          </Badge>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </DialogHeader>
  )
}

/**
 * The preview dialog's footer, which says what the format is for: AR Quick Look for USDZ, an
 * interactive 3D preview for GLB.
 */
export function PreviewFooter({ modelType }: { modelType: ArModelType }) {
  return (
    <div className="p-4 border-t border-border bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Monitor className="h-4 w-4" />
          <span>
            {modelType === 'usdz' ? 'iOS AR Quick Look Compatible' : 'Interactive 3D Preview'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {modelType === 'usdz' ? 'AR Ready' : '3D Model'}
          </Badge>
        </div>
      </div>
    </div>
  )
}
