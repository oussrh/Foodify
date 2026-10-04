// components/capture/capture-guide.tsx
// How to film a dish so the engine can model it: the things that decide whether a capture works,
// in the order a cook does them, with the three heights drawn (capture-angles.tsx). Walking round a
// still plate and turning the plate in front of a still phone need different tables and light, so
// each mode has its own steps. The engine's warnings point back at the same advice.
import { Camera, Focus, LayoutGrid, RotateCw, Ruler, Sun, type LucideIcon } from 'lucide-react'
import type { CaptureMode } from '@/lib/schemas/capture'
import { CaptureAngles } from './capture-angles'

type Step = { icon: LucideIcon; title: string; text: string; drawing?: boolean }

const FOCUS: Step = { icon: Focus, title: 'Lock focus and exposure', text: 'Video in 4K, HDR video off. Hold a finger on the dish until AE/AF LOCK shows.' }
const MEASURE: Step = { icon: Ruler, title: 'Measure the plate', text: 'Its diameter gives the model its real size on the table.' }

const STEPS: Record<CaptureMode, Step[]> = {
  WALKAROUND: [
    { icon: LayoutGrid, title: 'A patterned placemat', text: 'Not a white or glossy table: the pattern is what the engine follows. Newspaper works.' },
    { icon: Sun, title: 'Soft, even light', text: 'Near a window without direct sun, or under the ceiling light. No flash.' },
    FOCUS,
    {
      icon: RotateCw,
      drawing: true,
      title: 'Three slow circles, in one video',
      text: 'Walk around the dish, keeping the phone 30–50 cm from the plate and the whole plate in view, at the three heights below. Slowly: a full circle takes 20–30 seconds. Hold the phone sideways (landscape).',
    },
    {
      icon: Camera,
      title: 'Then about 4 photos',
      text: 'In photo mode, without moving the dish: one from straight above, then three around the plate at a guest’s eye level (about 30°), the whole plate in each. They give the model its sharpest detail.',
    },
    MEASURE,
  ],
  TURNTABLE: [
    { icon: LayoutGrid, title: 'A turntable, a calm background', text: 'A lazy Susan or a cake stand that turns smoothly. Nothing moving behind the dish: the engine cuts the dish out of every frame.' },
    { icon: Sun, title: 'Light from all around', text: 'The dish turns through the light, so light from one side makes it change as it turns. A room lit evenly, or a lamp on each side. No direct sun, no flash.' },
    FOCUS,
    {
      icon: RotateCw,
      drawing: true,
      title: 'Three slow turns, in one video',
      text: 'Keep the phone still, on a stand or held firmly, 30–50 cm from the plate with the whole plate in view. Turn the plate one full turn in 20–30 seconds, hands out of the picture, then raise the phone to the next height and turn again.',
    },
    {
      icon: Camera,
      title: 'Then about 4 photos',
      text: 'In photo mode: one from straight above, then three at a guest’s eye level (about 30°), turning the plate a third of a turn between them, the whole plate in each. They give the model its sharpest detail.',
    },
    MEASURE,
  ],
}

/** The filming advice for `mode` as a numbered list, with the heights drawn under the step they belong to. */
export function CaptureGuide({ mode }: { mode: CaptureMode }) {
  return (
    <ol className="space-y-3">
      {STEPS[mode].map(({ icon: Icon, title, text, drawing }) => (
        <li key={title} className="flex gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{text}</p>
            {drawing && <CaptureAngles mode={mode} />}
          </div>
        </li>
      ))}
    </ol>
  )
}
