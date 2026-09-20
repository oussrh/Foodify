'use client'

// The uploaded dish image: the picture with its format and dimensions, the four actions
// (Preview, Download, Replace, Remove) and the details Cloudinary reported.
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Download, Eye, Info, RefreshCw, X } from 'lucide-react'

export interface DishImageInfo {
  dimensions?: string
  size?: string
  format?: string
}

interface DishImagePreviewProps {
  url: string
  info: DishImageInfo
  onPreview: () => void
  onDownload: () => void
  onReplace: () => void
  onRemove: () => void
}

export function DishImagePreview({ url, info, onPreview, onDownload, onReplace, onRemove }: DishImagePreviewProps) {
  return (
    <div className="space-y-4">
      <div className="relative w-full h-64 rounded-lg overflow-hidden">
        <Image
          src={url}
          alt="Dish preview"
          fill
          className="object-cover transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300" />

        {/* Image overlay with info */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-card/90 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-foreground">Image uploaded</span>
              </div>
              <div className="flex items-center gap-1">
                {info.format && (
                  <Badge className="bg-muted text-muted-foreground border-border text-xs">
                    {info.format}
                  </Badge>
                )}
                {info.dimensions && (
                  <Badge className="bg-muted text-muted-foreground border-border text-xs">
                    {info.dimensions}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={onPreview}
          className="border-border text-muted-foreground hover:bg-muted hover:border-border"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button
          variant="outline"
          onClick={onDownload}
          className="border-border text-muted-foreground hover:bg-muted hover:border-border"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button
          variant="outline"
          onClick={onReplace}
          className="border-border text-success hover:bg-muted hover:border-border"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Replace
        </Button>
        <Button
          variant="outline"
          onClick={onRemove}
          className="border-border text-destructive hover:bg-muted hover:border-border"
        >
          <X className="h-4 w-4 mr-2" />
          Remove
        </Button>
      </div>

      {/* Image Details */}
      {(info.dimensions || info.size) && (
        <div className="p-4 border border-border rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Image Details</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            {info.dimensions && (
              <div>
                <span className="font-medium">Dimensions:</span>
                <br />
                <span>{info.dimensions} px</span>
              </div>
            )}
            {info.size && (
              <div>
                <span className="font-medium">File Size:</span>
                <br />
                <span>{info.size}</span>
              </div>
            )}
            {info.format && (
              <div>
                <span className="font-medium">Format:</span>
                <br />
                <span>{info.format}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
