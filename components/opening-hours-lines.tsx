// components/opening-hours-lines.tsx
// The opening hours as lines: the day span left, the hours right, the note under them. The
// public menu's footer and the settings' contact preview both list them this way.
import type { summarizeOpeningHours } from '@/lib/opening-hours'

/**
 * Renders summarized opening hours as day-span and hours rows with the note under them; the public
 * menu's footer and the settings' contact preview share it.
 */
export default function OpeningHoursLines({ lines, note, noteClassName }: { lines: ReturnType<typeof summarizeOpeningHours>; note: string | null | undefined; noteClassName: string }) {
  return (
    <span className="flex flex-col gap-0.5">
      {lines.map((l) => (
        <span key={l.days} className="flex justify-between gap-3">
          <span>{l.days}</span>
          <span className="tnum">{l.hours}</span>
        </span>
      ))}
      {note && <span className={noteClassName}>{note}</span>}
    </span>
  )
}
