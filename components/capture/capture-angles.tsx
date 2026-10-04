// components/capture/capture-angles.tsx
// The three circles, drawn: from the side, full width, where the phone is for each (about 15°, 40°
// and 65° above the table, its lens facing the dish); from above, small, that each is a full circle
// round the plate. Distances and durations are said in words under the drawings, where they stay
// legible at a phone's width. The numbers a cook can film from, and the ones the engine's warnings use.

const CIRCLES = [
  { n: 1, angle: 15, label: 'Low, about 15°', time: '20–30 s' },
  { n: 2, angle: 40, label: 'Middle, about 40°', time: '20–30 s' },
  { n: 3, angle: 65, label: 'High, about 65°', time: '20–30 s' },
]

const TABLE = 160
const TARGET = { x: 178, y: 144 }
const REACH = 112

/** Where the phone is for a circle at `angle` degrees above the table, on the left of the dish. */
function phoneAt(angle: number) {
  const rad = (angle * Math.PI) / 180
  return { x: TARGET.x - REACH * Math.cos(rad), y: TARGET.y - REACH * Math.sin(rad) }
}

function Phone({ n, angle }: { n: number; angle: number }) {
  const { x, y } = phoneAt(angle)
  return (
    <g>
      <line x1={x} y1={y} x2={TARGET.x} y2={TARGET.y} className="stroke-primary" strokeWidth="1.5" strokeDasharray="5 4" />
      {/* Upright, its lens faces right; turned by the angle, the lens looks down at the dish. */}
      <g transform={`rotate(${angle} ${x} ${y})`}>
        <rect x={x - 6} y={y - 11} width="12" height="22" rx="3" className="fill-card stroke-foreground" strokeWidth="1.5" />
        <circle cx={x + 6} cy={y - 6} r="1.8" className="fill-foreground" />
      </g>
      <text x={x - 13} y={y + 5} textAnchor="end" fontSize="13" className="fill-foreground font-semibold">
        {n} · {angle}°
      </text>
    </g>
  )
}

function SideView() {
  return (
    <svg viewBox="0 22 250 146" className="w-full" role="img" aria-label="From the side: the phone at three heights, about 15, 40 and 65 degrees above the table, its lens facing the dish">
      <line x1="4" y1={TABLE} x2="246" y2={TABLE} className="stroke-muted-foreground" strokeWidth="1.5" />
      <path d={`M ${TARGET.x - 46} ${TABLE} L ${TARGET.x - 40} ${TABLE - 9} L ${TARGET.x + 40} ${TABLE - 9} L ${TARGET.x + 46} ${TABLE} Z`} className="fill-muted stroke-muted-foreground" strokeWidth="1" />
      <path d={`M ${TARGET.x - 24} ${TABLE - 9} Q ${TARGET.x} ${TABLE - 42} ${TARGET.x + 24} ${TABLE - 9} Z`} className="fill-primary/35 stroke-primary" strokeWidth="1" />
      {CIRCLES.map((circle) => (
        <Phone key={circle.n} {...circle} />
      ))}
    </svg>
  )
}

function TopView() {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20 shrink-0" role="img" aria-label="From above: a full circle round the plate">
      <circle cx="50" cy="50" r="40" className="fill-none stroke-primary" strokeWidth="2" strokeDasharray="6 5" />
      <path d="M 90 44 l -6 10 l 12 0 Z" className="fill-primary" />
      <circle cx="50" cy="50" r="19" className="fill-muted stroke-muted-foreground" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="9" className="fill-primary/35 stroke-primary" strokeWidth="1.5" />
    </svg>
  )
}

/** The side view, the top view with what it means, then the three circles with their duration. */
export function CaptureAngles() {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <SideView />
      <p className="text-sm text-muted-foreground">From the side: the phone 30–50 cm from the plate, its lens on the dish.</p>
      <div className="flex items-center gap-3">
        <TopView />
        <p className="text-sm text-muted-foreground">From above: each height is a full circle round the dish, walking slowly, the whole plate always in view.</p>
      </div>
      <ol className="space-y-1 border-t pt-2 text-sm">
        {CIRCLES.map(({ n, label, time }) => (
          <li key={n} className="flex justify-between gap-3">
            <span>
              <span className="font-medium">{n}.</span> {label}, a full circle
            </span>
            <span className="whitespace-nowrap text-muted-foreground">{time}</span>
          </li>
        ))}
        <li className="flex justify-between gap-3 border-t pt-1 font-medium">
          <span>In all, one video</span>
          <span className="whitespace-nowrap">1–1½ min</span>
        </li>
      </ol>
    </div>
  )
}
