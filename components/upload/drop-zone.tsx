'use client'

// The dashed drop zone of the AR model, logo and cover uploads: a hidden file input behind a
// full-size label, showing either the progress pane while a file is on its way or the prompt
// to pick one. The GLB zone paints its text in the success colour; the others stay muted.
import type { ChangeEvent, ReactNode } from 'react'
import { CloudUpload, Loader2 } from 'lucide-react'

export type ZoneTone = 'muted' | 'success'

const TONES = {
  muted: { text: 'text-muted-foreground', hover: 'group-hover:text-muted-foreground', track: 'bg-muted' },
  success: { text: 'text-success', hover: 'group-hover:text-success', track: 'bg-green-200' },
} as const

interface DropZoneProps {
  /** The input's id and the label's target. */
  id: string
  accept: string
  disabled: boolean
  /** Greys the label out (the whole zone is disabled by the form, not only by an upload in flight). */
  dimmed?: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  children: ReactNode
}

/**
 * The dashed drop zone of the AR model, logo and cover uploads: a hidden file input behind a full-
 * size label, with the progress or the prompt as its children.
 */
export function DropZone({ id, accept, disabled, dimmed, onChange, children }: DropZoneProps) {
  return (
    <div className="border-2 border-dashed border-border rounded-md p-8 text-center hover:border-border-strong hover:bg-muted transition-colors group">
      <input
        type="file"
        accept={accept}
        onChange={onChange}
        disabled={disabled}
        className="hidden"
        id={id}
      />
      <label htmlFor={id} className={dimmed ? 'cursor-pointer cursor-not-allowed opacity-50' : 'cursor-pointer'}>
        <div className="space-y-4">
          {children}
        </div>
      </label>
    </div>
  )
}

interface UploadProgressProps {
  /** e.g. "Uploading USDZ..." */
  label: string
  progress: number
  tone?: ZoneTone
  /** Caps the bar at max-w-xs and centres it (logo and cover). */
  narrow?: boolean
}

/**
 * The pane a drop zone shows while a file uploads: a spinner, the label, a progress bar and the
 * rounded percentage.
 */
export function UploadProgress({ label, progress, tone = 'muted', narrow }: UploadProgressProps) {
  const t = TONES[tone]
  return (
    <>
      <div className="relative">
        <Loader2 className={`h-10 w-10 ${t.text} mx-auto animate-spin`} />
        <div className="absolute inset-0 bg-muted rounded-full opacity-20"></div>
      </div>
      <div>
        <p className={`text-sm ${t.text} font-medium`}>{label}</p>
        <div className={`mt-2 w-full ${t.track} rounded-full h-2${narrow ? ' max-w-xs mx-auto' : ''}`}>
          <div
            className="bg-primary h-2 rounded-full transition-colors"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className={`text-xs ${t.text} mt-1`}>{Math.round(progress)}%</p>
      </div>
    </>
  )
}

interface UploadPromptProps {
  /** e.g. "Upload USDZ file" */
  title: string
  /** The third line: what the file is for or what is accepted. */
  hint: string
  tone?: ZoneTone
}

/**
 * The pane a drop zone shows while idle: the upload icon, the title, the browse-or-drop line and a
 * hint of what the file is for.
 */
export function UploadPrompt({ title, hint, tone = 'muted' }: UploadPromptProps) {
  const t = TONES[tone]
  return (
    <>
      <CloudUpload className={`h-10 w-10 text-muted-foreground mx-auto ${t.hover} transition-colors`} />
      <div>
        <p className={`text-sm font-medium text-foreground ${t.hover}`}>{title}</p>
        <p className="text-xs text-muted-foreground mt-1">Click to browse or drag and drop</p>
        <p className={`text-xs ${t.text} mt-2`}>{hint}</p>
      </div>
    </>
  )
}
