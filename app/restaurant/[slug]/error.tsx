'use client'

import { useEffect } from 'react'

export default function RestaurantError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Menu failed to render:', error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <span className="h-3 w-3 rounded-full bg-destructive" aria-hidden="true" />
      <h1 className="text-2xl font-semibold tracking-display">The menu could not be loaded</h1>
      <p className="max-w-sm text-sm text-muted-foreground">Check your connection and try again. If it keeps happening, the staff can show you the menu.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-semibold text-background"
      >
        Try again
      </button>
    </main>
  )
}
