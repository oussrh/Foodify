// components/pos/resume-controls.tsx
// Resuming a paused connection. Events went on being queued during the pause; when some are
// waiting the owner says what becomes of them: sent now, or discarded (kept for the record and
// never sent, for a till that was dealt with by hand in the meantime).
'use client'

import { resumePos } from '@/app/actions/pos-control-actions'
import { Button } from '@/components/ui/button'
import { usePosAction } from './use-pos-action'

/** Resume, or, with `waiting` events queued during the pause, "Send them" and "Discard them". */
export function ResumeControls({ restaurantId, waiting }: { restaurantId: string; waiting: number }) {
  const { busy, run } = usePosAction()
  if (waiting === 0) {
    return (
      <Button variant="outline" className="h-12" disabled={busy} onClick={() => void run(() => resumePos(restaurantId, { waiting: 'send' }), 'Sending again')}>
        Resume
      </Button>
    )
  }
  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-warning/40 px-4 py-3">
      <p className="text-sm">
        {waiting === 1 ? '1 event waited' : `${waiting} events waited`} while paused. Resume by sending them to the POS, or discard them if the till was updated by hand.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button className="h-12" disabled={busy} onClick={() => void run(() => resumePos(restaurantId, { waiting: 'send' }), 'Sending again')}>
          Send them
        </Button>
        <Button variant="outline" className="h-12" disabled={busy} onClick={() => void run(() => resumePos(restaurantId, { waiting: 'discard' }), 'Discarded, and sending again')}>
          Discard them
        </Button>
      </div>
    </div>
  )
}
