'use client'

// The "Copy" action on an open day: a menu that lists the other days as checkboxes, so the
// restaurant copies this day's hours to the ones it picks (not always every day). Picking a day
// keeps the menu open; "Copy to N days" writes them and closes.
import { useState } from 'react'
import { Copy } from 'lucide-react'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DAY_KEYS, dayName, type DayKey } from '@/lib/opening-hours'

/**
 * Copies one day's opening hours to the days picked from a checklist. Nothing is copied until the
 * "Copy to N days" item is chosen.
 */
export default function CopyHoursMenu({ day, disabled, onCopy }: { day: DayKey; disabled?: boolean | undefined; onCopy: (targets: DayKey[]) => void }) {
  const others = DAY_KEYS.filter((d) => d !== day)
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<Set<DayKey>>(new Set())

  // Start each opening with none picked (reset in the open handler, not an effect).
  const onOpenChange = (next: boolean) => {
    if (next) setPicked(new Set())
    setOpen(next)
  }

  const toggle = (d: DayKey) => {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })
  }

  const apply = () => {
    if (picked.size > 0) onCopy([...picked])
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Copy ${dayName(day, 'en', 'long')}'s hours to other days`}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border px-2 text-xs font-medium text-muted-foreground hover:border-border-strong hover:bg-accent hover:text-foreground"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          Copy
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Copy {dayName(day, 'en', 'long')}&rsquo;s hours to</DropdownMenuLabel>
        {others.map((d) => (
          <DropdownMenuCheckboxItem key={d} checked={picked.has(d)} onSelect={(e) => e.preventDefault()} onCheckedChange={() => toggle(d)}>
            {dayName(d, 'en', 'long')}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setPicked(new Set(others))} className="text-xs text-muted-foreground">
          Select every other day
        </DropdownMenuItem>
        <DropdownMenuItem disabled={picked.size === 0} onSelect={apply} className="justify-center font-semibold text-primary focus:text-primary">
          Copy to {picked.size || 0} {picked.size === 1 ? 'day' : 'days'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
