'use client'

// The three full-page states of the AR viewer before the model shows: no model in the URL,
// the viewer script loading, and a load failure.
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from 'lucide-react'

/** The full page shown when the viewer was opened without a model URL; its only action closes the window. */
export function NoModelScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-background to-muted">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="mx-auto w-20 h-20 bg-destructive/20 rounded-2xl flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">No Model Specified</h1>
          <p className="text-muted-foreground">Please provide a valid 3D model URL to continue</p>
        </div>
        <Button
          onClick={() => window.close()}
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    </div>
  )
}

/**
 * The full page shown while the viewer script loads, with the dish name and a progress bar. The
 * progress is the script loader's simulated figure, not a real download measure.
 */
export function LoadingScreen({ dishName, loadingProgress }: { dishName: string; loadingProgress: number }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-purple-900/20 via-background to-indigo-900/20 dark:from-purple-900 dark:via-black dark:to-indigo-900">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="relative">
          <div className="mx-auto w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
          <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-pulse"></div>
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Loading AR Experience</h1>
          <p className="text-muted-foreground">Preparing {dishName} in immersive 3D...</p>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-linear-to-r from-primary to-primary/80 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-muted-foreground">{Math.round(loadingProgress)}% loaded</p>
        </div>
      </div>
    </div>
  )
}

/**
 * The full page shown when the viewer fails to load: the message, Retry (which reloads the page)
 * and Go Back (which closes the window).
 */
export function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-destructive/20 via-background to-muted">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="mx-auto w-20 h-20 bg-destructive/20 rounded-2xl flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Error Loading AR</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
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
