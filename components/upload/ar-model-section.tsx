'use client'

// One of the two columns of the AR model upload: the format's header and badge, then either
// the uploaded model with its actions or the drop zone. USDZ and GLB differ only by the
// words, the icons and the colour of the GLB column.
import type { ChangeEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Apple, CheckCircle, Globe, Monitor, Smartphone } from 'lucide-react'
import type { ArModelType } from '@/components/upload/targets'
import { DropZone, UploadProgress, UploadPrompt } from '@/components/upload/drop-zone'
import { UploadedActions } from '@/components/upload/uploaded-actions'

const FORMATS = {
  usdz: {
    Icon: Smartphone,
    iconClass: 'h-5 w-5 text-muted-foreground',
    title: 'iOS AR Model',
    subtitle: 'USDZ format',
    badgeClass: 'bg-muted text-muted-foreground border-border flex items-center gap-1',
    BadgeIcon: Apple,
    badgeText: 'iOS Only',
    uploadedText: 'USDZ model uploaded',
    inputId: 'usdz-upload',
    accept: '.usdz',
    uploadingLabel: 'Uploading USDZ...',
    promptTitle: 'Upload USDZ file',
    promptHint: 'For iOS AR Quick Look',
    tone: 'muted',
  },
  glb: {
    Icon: Monitor,
    iconClass: 'h-5 w-5 text-success',
    title: 'Web AR Model',
    subtitle: 'GLB format',
    badgeClass: 'bg-muted text-success border-border flex items-center gap-1',
    BadgeIcon: Globe,
    badgeText: 'All Devices',
    uploadedText: 'GLB model uploaded',
    inputId: 'glb-upload',
    accept: '.glb',
    uploadingLabel: 'Uploading GLB...',
    promptTitle: 'Upload GLB file',
    promptHint: 'For web and Android AR',
    tone: 'success',
  },
} as const

interface ArModelSectionProps {
  type: ArModelType
  /** The model already uploaded, if any. */
  url?: string | undefined
  /** True while this format's file is on its way. */
  uploading: boolean
  progress: number
  /** The input is held while either format uploads. */
  disabled: boolean
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onPreview: (url: string) => void
  onDownload: (url: string) => void
  onRemove: () => void
}

/**
 * One format's column of the AR model upload, USDZ or GLB: the uploaded model with Preview,
 * Download and Remove, or else the drop zone with its progress while a file uploads.
 */
export function ArModelSection({ type, url, uploading, progress, disabled, onFileChange, onPreview, onDownload, onRemove }: ArModelSectionProps) {
  const f = FORMATS[type]
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <f.Icon className={f.iconClass} />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{f.title}</h4>
            <p className="text-sm text-muted-foreground">{f.subtitle}</p>
          </div>
        </div>
        <Badge className={f.badgeClass}>
          <f.BadgeIcon className="h-3 w-3" />
          {f.badgeText}
        </Badge>
      </div>

      {url ? (
        <div className="space-y-4">
          <div className="p-4 border border-border rounded-md">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-success">{f.uploadedText}</p>
                <p className="text-xs text-success break-all mt-1">{url}</p>
              </div>
            </div>
          </div>
          <UploadedActions onPreview={() => onPreview(url)} onDownload={() => onDownload(url)} onRemove={onRemove} />
        </div>
      ) : (
        <DropZone id={f.inputId} accept={f.accept} onChange={onFileChange} disabled={disabled}>
          {uploading ? (
            <UploadProgress label={f.uploadingLabel} progress={progress} tone={f.tone} />
          ) : (
            <UploadPrompt title={f.promptTitle} hint={f.promptHint} tone={f.tone} />
          )}
        </DropZone>
      )}
    </div>
  )
}
