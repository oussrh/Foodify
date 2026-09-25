import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StaffTheme } from '@/components/theme-provider'

export { staffViewport as viewport } from '@/lib/staff-viewport'

/** The landing page: it leads to the portals, so it wears the staff theme scope. */
export default function HomePage() {
  return (
    <StaffTheme>
      <main className="flex min-h-screen flex-col bg-background">
        <header className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4 font-semibold sm:px-6">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
          Foodify
          <nav className="ml-auto flex items-center gap-2 text-sm font-medium">
            <Button asChild variant="ghost" size="sm">
              <Link href="/manager/login">Manager sign in</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/login">Admin</Link>
            </Button>
          </nav>
        </header>
        <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 px-4 py-16 sm:px-6">
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-display sm:text-5xl">
            Menus your guests can put on the table.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Foodify turns a restaurant menu into a QR code. Guests scan it, browse in their language, and see any dish in
            augmented reality at true size before they order.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/manager/login">Open your dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/restaurant/foodify-test-kitchen">See a sample menu</Link>
            </Button>
          </div>
        </section>
        <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} Foodify
        </footer>
      </main>
    </StaffTheme>
  )
}
