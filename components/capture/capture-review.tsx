// components/capture/capture-review.tsx
// A finished capture, waiting for someone to look at it: its real size against the plate, what the
// engine warns about, the 3D preview, and Accept (onto the dish) or Film again. A failed capture
// shows why, with the same warnings as advice for the next try.
'use client'

import { AlertTriangle, Box } from 'lucide-react'
import { acceptCapture } from '@/app/actions/capture-review-actions'
import { Button } from '@/components/ui/button'
import type { CaptureView } from '@/lib/capture'
import { useCaptureAction } from './use-capture-action'

type Props = {
  job: CaptureView
  onPreview: (url: string) => void
  onAccepted: (glbUrl: string, usdzUrl: string) => void
  onFilmAgain: () => void
}

/** Review of a READY capture, or the reason a FAILED one did not work. */
export function CaptureReview({ job, onPreview, onAccepted, onFilmAgain }: Props) {
  const { busy, run } = useCaptureAction()
  const accept = async () => {
    const outcome = await run(() => acceptCapture(job.id))
    if (outcome) onAccepted(outcome.glbUrl, outcome.usdzUrl)
  }
  const size = job.summary?.sizeCm

  return (
    <div className="space-y-4">
      {job.status === 'FAILED' ? (
        <p className="text-sm text-destructive">No model could be made from this video. {job.error}</p>
      ) : (
        size && (
          <p className="text-sm">
            {size.width} × {size.depth} cm, {size.height} cm tall, for a {job.plateCm} cm plate · {job.summary?.glbMb} MB
          </p>
        )
      )}
      {job.warnings.length > 0 && <Warnings warnings={job.warnings} />}
      <div className="flex flex-wrap gap-2">
        {job.previewUrl && (
          <Button type="button" variant="outline" className="h-11" onClick={() => onPreview(job.previewUrl ?? '')}>
            <Box className="mr-2 h-4 w-4" aria-hidden /> Look at it in 3D
          </Button>
        )}
        {job.status === 'READY' && (
          <Button type="button" className="h-11" disabled={busy} onClick={accept}>
            {busy ? 'Putting it on the dish…' : 'Accept: use it on the menu'}
          </Button>
        )}
        <Button type="button" variant="ghost" className="h-11" disabled={busy} onClick={onFilmAgain}>
          Film again
        </Button>
      </div>
    </div>
  )
}

function Warnings({ warnings }: { warnings: string[] }) {
  return (
    <ul className="space-y-1 rounded-sm border border-warning/40 bg-warning/10 p-3">
      {warnings.map((warning, index) => (
        // The engine's words may repeat; the list never reorders, so the position is a stable key.
        <li key={index} className="flex gap-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          {warning}
        </li>
      ))}
    </ul>
  )
}
