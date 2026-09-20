'use client'

// The row under an uploaded AR model, logo or cover: Preview, Download, Remove.
import { Button } from '@/components/ui/button'
import { Download, Eye, X } from 'lucide-react'

interface UploadedActionsProps {
  onPreview: () => void
  onDownload: () => void
  onRemove: () => void
  /** Preview and Download follow the form's disabled flag. */
  disabled?: boolean
  /** Remove is also held while an upload is in flight. */
  removeDisabled?: boolean
}

export function UploadedActions({ onPreview, onDownload, onRemove, disabled, removeDisabled }: UploadedActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onPreview}
        className="border-border text-muted-foreground hover:bg-muted"
        disabled={disabled}
      >
        <Eye className="h-4 w-4 mr-2" />
        Preview
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onDownload}
        className="border-border text-muted-foreground hover:bg-muted"
        disabled={disabled}
      >
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onRemove}
        className="border-border text-destructive hover:bg-muted"
        disabled={removeDisabled}
      >
        <X className="h-4 w-4 mr-2" />
        Remove
      </Button>
    </div>
  )
}
