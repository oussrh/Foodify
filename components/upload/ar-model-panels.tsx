'use client'

// The panels around the AR model upload's two columns: what a model must be, what to do when
// the browser upload is not configured, and the "ready" summary once a model is on file.
import { Apple, CloudUpload, Globe, Info, Zap } from 'lucide-react'
import { restaurantFolderName } from '@/components/upload/targets'

/**
 * The AR upload's requirements panel: USDZ for iOS, GLB for Android and the web, 50MB per file, and
 * the folder the models are stored in.
 */
export function ArRequirements({ restaurantName }: { restaurantName: string }) {
  return (
    <div className="p-6 border border-border rounded-md">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center">
          <Info className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-muted-foreground mb-3">
            AR Model Requirements
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Apple className="h-4 w-4" />
                <span className="font-medium">USDZ Format</span>
              </div>
              <p className="text-muted-foreground">iOS devices (iPhone/iPad) - Apple&apos;s AR Quick Look</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span className="font-medium">GLB Format</span>
              </div>
              <p className="text-muted-foreground">Android and web browsers - WebXR compatible</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg space-y-1 text-sm text-muted-foreground">
            <p><strong>File size:</strong> Maximum 50MB per file</p>
            <p><strong>Storage:</strong> Files organized in &apos;{restaurantFolderName(restaurantName)}/ar&apos;</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * What the AR upload shows in place of its columns when the browser upload to Cloudinary is not
 * configured.
 */
export function ArUploadUnavailable() {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-20 h-20 bg-muted rounded-lg flex items-center justify-center mb-4">
        <CloudUpload className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">AR Upload Unavailable</h3>
      <p className="text-sm text-muted-foreground">Cloudinary configuration required to enable this feature</p>
    </div>
  )
}

/**
 * The summary shown once a model is on file: which AR experiences a guest now gets, iOS Quick Look
 * for a USDZ and web AR for a GLB.
 */
export function ArReadyStatus({ hasUsdz, hasGlb }: { hasUsdz: boolean; hasGlb: boolean }) {
  return (
    <div className="p-6 border border-border rounded-md">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-12 h-12 rounded-md flex items-center justify-center">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            🎉 AR Experience Ready!
          </h3>
          <div className="space-y-2 text-sm">
            {hasUsdz && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Apple className="h-4 w-4" />
                <span>iOS AR Quick Look available</span>
              </div>
            )}
            {hasGlb && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span>Web AR experience available</span>
              </div>
            )}
            <p className="text-muted-foreground font-medium mt-3">
              Customers can now view this dish in augmented reality!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
