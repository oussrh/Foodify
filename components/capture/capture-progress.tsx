// components/capture/capture-progress.tsx
// A capture the engine is working on: its stages as a list, the finished ones ticked and the current
// one named, a line when the engine has stopped answering (the page keeps asking), and "Put it aside"
// so a capture that never finishes is never a dead end.
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CAPTURE_STAGES, type CaptureProgress as Progress } from '@/lib/capture'

type Props = {
  progress: Progress | null
  offline: boolean
  busy: boolean
  onPutAside: () => void
}

/** The engine's stages for `progress`; `offline` when the last question went unanswered. */
export function CaptureProgress({ progress, offline, busy, onPutAside }: Props) {
  const step = progress?.step ?? 0
  return (
    <div className="space-y-3" aria-live="polite">
      <p className="text-sm text-muted-foreground">
        {step === 0 ? 'The video is in the queue.' : `Step ${step} of ${progress?.of}: ${progress?.label}.`} You can leave this page; the model keeps being made.
      </p>
      <ol className="space-y-2">
        {CAPTURE_STAGES.map((stage, index) => (
          <li key={stage.key} className={index + 1 > step ? 'flex items-center gap-2 text-sm text-muted-foreground' : 'flex items-center gap-2 text-sm'}>
            <StepMark state={index + 1 < step ? 'done' : index + 1 === step ? 'current' : 'next'} />
            {stage.label}
          </li>
        ))}
      </ol>
      {offline && <p className="text-sm text-warning">The engine is not answering right now. This page will keep checking.</p>}
      <Button type="button" variant="ghost" className="h-11" disabled={busy} onClick={onPutAside}>
        Put it aside
      </Button>
    </div>
  )
}

function StepMark({ state }: { state: 'done' | 'current' | 'next' }) {
  if (state === 'done') return <Check className="h-4 w-4 text-success" role="img" aria-label="done" />
  if (state === 'current') return <Loader2 className="h-4 w-4 animate-spin text-primary" role="img" aria-label="in progress" />
  return <span className="h-4 w-4" aria-hidden />
}
