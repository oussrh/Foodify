/** Skeleton for the public menu: same shapes as the real page, so nothing jumps when data arrives. */
export default function RestaurantLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground" aria-busy="true" aria-live="polite">
      <div className="h-44 w-full animate-pulse bg-muted sm:h-60 lg:h-72" />
      <div className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 sm:px-6">
          <div className="h-10 flex-1 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-[70px] animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="mx-auto flex max-w-5xl gap-1.5 px-4 pb-2.5 sm:px-6">
          {[72, 56, 64, 80].map((w, i) => (
            <div key={i} className="h-8 animate-pulse rounded-full bg-muted" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mt-6 h-6 w-32 animate-pulse rounded bg-muted" />
        <ul className="mt-2 md:grid md:grid-cols-2 md:gap-x-8 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="grid grid-cols-[76px_1fr_auto] items-center gap-3 border-b border-border py-3">
              <div className="h-[76px] w-[76px] animate-pulse rounded-md bg-muted" />
              <div className="flex flex-col gap-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
              </div>
              <div className="h-4 w-12 animate-pulse rounded bg-muted" />
            </li>
          ))}
        </ul>
      </div>
      <span className="sr-only">Loading the menu</span>
    </div>
  )
}
