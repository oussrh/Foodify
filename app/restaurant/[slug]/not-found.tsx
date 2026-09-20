import Link from 'next/link'

export default function RestaurantNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <span className="h-3 w-3 rounded-full bg-primary" aria-hidden="true" />
      <h1 className="text-2xl font-semibold tracking-display">This menu isn&rsquo;t here</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The link may be out of date, or the restaurant may have changed its address. Ask the staff for the current QR code.
      </p>
      <Link href="/" className="mt-2 text-sm font-medium text-primary hover:underline">
        Foodify
      </Link>
    </main>
  )
}
