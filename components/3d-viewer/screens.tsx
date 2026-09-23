'use client'

// The three full-page states of the 3D page before the model shows: no model in the URL,
// the viewer script loading, and a load failure.
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, Loader2, RotateCcw } from 'lucide-react'

/** What the 3D page shows when the URL carries no `model`: a message and a Go Back that closes the window. */
export function NoModelScreen() {
  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <div className="w-20 h-20 bg-destructive/20 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">No Model Specified</h1>
          <p className="text-muted-foreground max-w-md">Please provide a valid 3D model URL to view the interactive model.</p>
        </div>
        <Button onClick={() => window.close()} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    </div>
  )
}

/** The full-page state while the model-viewer script loads; it names the dish being prepared. */
export function LoadingScreen({ dishName }: { dishName: string }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">Loading 3D Viewer</h1>
          <p className="text-muted-foreground">Preparing {dishName} in immersive 3D...</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}

/**
 * The full-page state when the viewer script fails to load: the message, a Retry that reloads the
 * page, and a Go Back that closes the window.
 */
export function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <div className="w-20 h-20 bg-destructive/20 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">Error Loading 3D Model</h1>
          <p className="text-muted-foreground max-w-md">{error}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/10"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button
            onClick={() => window.close()}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}
