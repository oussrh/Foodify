import { Search } from 'lucide-react'

/** The GET search box above a list page's table; the query travels as `?search=`. */
export function ListSearch({ value, placeholder, label }: { value: string; placeholder: string; label: string }) {
  return (
    <form method="get" className="relative max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        name="search"
        defaultValue={value}
        placeholder={placeholder}
        aria-label={label}
        className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
      />
    </form>
  )
}
