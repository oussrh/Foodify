'use client'

// The panels around the dish image zone: the requirements and tips under it, and the whole
// layout shown when the browser upload is not configured.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, FileImage, ImageIcon, Sparkles, Zap } from 'lucide-react'
import { restaurantFolderName } from '@/components/upload/targets'
import { ConfigurationNotice } from '@/components/upload/status-notices'

/**
 * The requirements and tips under the dish image zone: formats, size and dimension limits, photo
 * advice, and the restaurant's dishes folder.
 */
export function DishImageRequirements({ restaurantName }: { restaurantName: string }) {
  return (
    <div className="p-6 border border-border rounded-md">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center">
          <FileImage className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-muted-foreground mb-3">
            Image Requirements & Tips
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Technical Requirements</span>
              </div>
              <ul className="space-y-1 text-muted-foreground ml-6">
                <li>• Format: JPG, PNG, WebP, or GIF</li>
                <li>• Maximum size: 10MB</li>
                <li>• Minimum: 400×300 pixels</li>
                <li>• Recommended: 800×600 pixels or higher</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Best Practices</span>
              </div>
              <ul className="space-y-1 text-muted-foreground ml-6">
                <li>• Use good lighting and clear focus</li>
                <li>• Show the complete dish</li>
                <li>• Use appetizing angles</li>
                <li>• Avoid busy backgrounds</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Storage:</strong> Images will be organized in &apos;{restaurantFolderName(restaurantName)}/dishes&apos; folder
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * The whole dish image upload as shown when the browser upload is not configured: a heading and the
 * notice naming the two variables to set.
 */
export function DishImageUnavailable() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
          <AlertCircle className="h-8 w-8 text-warning" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Image Upload Unavailable</h2>
        <p className="text-muted-foreground">Configuration required to enable this feature</p>
      </div>

      <Card className="border-0 overflow-hidden">
        <CardHeader className="text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-card/20 rounded-lg">
              <ImageIcon className="h-5 w-5" />
            </div>
            <span>Dish Image Upload</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <ConfigurationNotice feature="image" />
        </CardContent>
      </Card>
    </div>
  )
}
