import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offline · Foodify',
  robots: { index: false, follow: false },
}

/** Served by the service worker when a menu was never loaded on this device and there is no connection. */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <span className="h-3 w-3 rounded-full bg-primary" aria-hidden="true" />
      <h1 className="text-2xl font-semibold tracking-display">
        You&rsquo;re offline
        <span className="block text-base font-normal text-muted-foreground" lang="fr">
          Vous êtes hors ligne
        </span>
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This menu hasn&rsquo;t been saved on this device yet. Reconnect once and it will open without signal next time.
      </p>
      <a href="." className="mt-2 inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-semibold text-background">
        Try again
      </a>
    </main>
  )
}
