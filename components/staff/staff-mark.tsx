// components/staff/staff-mark.tsx
// The Foodizar mark inline, from the same numbers the icons are drawn from (lib/staff-mark.ts), so
// the launch screen and the install invitation show exactly what the home screen shows. Always on
// Basil: the badge's ring is the ground colour, which is what parts it from the F.
import { STAFF_BRAND, type StaffBrandApp } from '@/lib/staff-apps'
import { STAFF_MARK } from '@/lib/staff-mark'

interface StaffMarkProps {
  app: StaffBrandApp
  className?: string | undefined
  /** Draw the app icon's rounded Basil square behind the mark, as the invitation does. */
  tile?: boolean
}

/** The white F with the app's badge; decorative, the words beside it name the app. */
export function StaffMark({ app, className, tile = false }: StaffMarkProps) {
  const { box, radius, bars, badge, glyphStroke, glyphs } = STAFF_MARK
  const { color, ink } = STAFF_BRAND
  return (
    <svg viewBox={`0 0 ${box} ${box}`} className={className} aria-hidden="true" focusable="false">
      {tile && <rect width={box} height={box} rx={box * 0.1875} fill={color} />}
      {bars.map((bar) => (
        <rect key={`${bar.x}-${bar.y}`} x={bar.x} y={bar.y} width={bar.width} height={bar.height} rx={radius} fill={ink} />
      ))}
      <circle cx={badge.cx} cy={badge.cy} r={badge.r + badge.ring} fill={color} />
      <circle cx={badge.cx} cy={badge.cy} r={badge.r} fill={ink} />
      <path d={glyphs[app]} fill="none" stroke={color} strokeWidth={glyphStroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
