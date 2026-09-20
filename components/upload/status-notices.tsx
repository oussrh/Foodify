'use client'

// The three notices every upload component shows above its zone: the success line with its
// hint, the error line, and the "configure Cloudinary" panel when the browser upload is not
// set up. Same markup in the four components; only the sentence differs.
import { AlertCircle, CheckCircle, type LucideIcon } from 'lucide-react'

interface SuccessNoticeProps {
  message: string
  /** The second line, e.g. "Your image is ready to use!". */
  hint: string
  icon?: LucideIcon
}

export function SuccessNotice({ message, hint, icon: Icon = CheckCircle }: SuccessNoticeProps) {
  return (
    <div className="p-4 border border-border rounded-md flex items-start gap-3">
      <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
        <Icon className="h-4 w-4 text-success" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-success">{message}</p>
        <p className="text-xs text-success mt-1">{hint}</p>
      </div>
    </div>
  )
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="p-4 border border-border rounded-md flex items-start gap-3">
      <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
        <AlertCircle className="h-4 w-4 text-destructive" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-destructive">{message}</p>
        <p className="text-xs text-destructive mt-1">Please check your file and try again</p>
      </div>
    </div>
  )
}

/** `feature` completes "To enable <feature> uploads": "AR file", "image", "cover image", "logo". */
export function ConfigurationNotice({ feature }: { feature: string }) {
  return (
    <div className="p-6 border border-border rounded-md">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-warning" />
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-warning mb-2">
            Configuration Required
          </p>
          <div className="space-y-3 text-sm text-warning">
            <p>{`To enable ${feature} uploads, please configure these environment variables:`}</p>
            <div className="bg-muted rounded-lg p-3 space-y-1 font-mono text-xs">
              <div>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</div>
              <div>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</div>
            </div>
            <p className="text-warning">Contact your administrator to enable this feature.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
