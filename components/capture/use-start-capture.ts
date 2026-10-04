// components/capture/use-start-capture.ts
// Starting a capture from the sheet, in three moves: the server makes the job and signs an upload
// address per file, the browser sends the video and the photos straight to the engine, the server
// tells the engine to begin. A send that fails puts the job aside, so the next try starts clean; a
// start the engine refused keeps the job, whose files are already there, for `retry` (no second
// upload of up to 2 GB). One start at a time, even under a double click.
'use client'

import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { createCapture, startCapture } from '@/app/actions/capture-actions'
import { discardCapture } from '@/app/actions/capture-review-actions'
import type { CaptureView } from '@/lib/capture'
import type { CaptureRequest } from '@/lib/schemas/capture'
import { useCaptureAction } from './use-capture-action'
import { useCaptureUpload } from './use-capture-upload'

/**
 * `start(request, video, photos)` answers the capture now processing, or null (and says why in a
 * toast); `unstarted` is a job whose files arrived but which the engine did not start, for `retry()`.
 */
export function useStartCapture() {
  const { busy, run } = useCaptureAction()
  const { progress, send } = useCaptureUpload()
  const [unstarted, setUnstarted] = useState<string | null>(null)
  const inFlight = useRef(false)

  const begin = useCallback(
    async (jobId: string) => {
      const started = await run(() => startCapture(jobId))
      setUnstarted(started ? null : jobId)
      return started?.job ?? null
    },
    [run],
  )

  const start = useCallback(
    async (request: CaptureRequest, video: File, photos: File[]): Promise<CaptureView | null> => {
      if (inFlight.current) return null
      inFlight.current = true
      try {
        const created = await run(() => createCapture(request))
        if (!created) return null
        if (!(await send(created.uploads, [video, ...photos]))) {
          toast.error('The files did not reach the engine. Check that it is running, then try again.')
          await discardCapture(created.jobId).catch(() => null)
          return null
        }
        return await begin(created.jobId)
      } finally {
        inFlight.current = false
      }
    },
    [run, send, begin],
  )

  const retry = useCallback(async () => (unstarted ? begin(unstarted) : null), [unstarted, begin])

  return { start, retry, unstarted: unstarted !== null, progress, busy: busy || progress !== null }
}
