// components/capture/dish-capture.tsx
// "Create from a video" in a dish's AR section: the card that starts a capture, follows it while
// the engine works, and offers it for review. Absent when the server has no capture engine. An
// accepted model is handed up to the form's asset state, so the AR uploads below show it at once.
'use client'

import { useState } from 'react'
import { Video } from 'lucide-react'
import { discardCapture } from '@/app/actions/capture-review-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CaptureProgress } from './capture-progress'
import { CaptureReview } from './capture-review'
import { CaptureSheet } from './capture-sheet'
import { useCaptureAction } from './use-capture-action'
import { useDishCapture } from './use-dish-capture'

type Props = {
  dishId: string
  onPreview: (url: string) => void
  onAccepted: (glbUrl: string, usdzUrl: string) => void
}

/** The capture card for one dish. */
export function DishCapture({ dishId, onPreview, onAccepted }: Props) {
  const { state, offline, setJob } = useDishCapture(dishId)
  const [open, setOpen] = useState(false)
  const { busy, run } = useCaptureAction()
  if (!state?.enabled) return null
  const { job } = state

  const filmAgain = async () => {
    if (job) await discardCapture(job.id).catch(() => null)
    setJob(null)
    setOpen(true)
  }
  const putAside = async () => {
    if (job && (await run(() => discardCapture(job.id)))) setJob(null)
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-3 text-lg">
          <Video className="h-5 w-5 text-muted-foreground" aria-hidden />
          Create the 3D model from a video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {!job || job.status === 'UPLOADING' ? (
          <Start interrupted={job?.status === 'UPLOADING'} onStart={filmAgain} />
        ) : job.status === 'PROCESSING' ? (
          <CaptureProgress progress={job.progress} offline={offline} busy={busy} onPutAside={putAside} />
        ) : (
          <CaptureReview
            job={job}
            onPreview={onPreview}
            onFilmAgain={filmAgain}
            onAccepted={(glbUrl, usdzUrl) => {
              setJob(null)
              onAccepted(glbUrl, usdzUrl)
            }}
          />
        )}
      </CardContent>
      <CaptureSheet open={open} onOpenChange={setOpen} dishId={dishId} restaurantName={state.restaurantName} hasLogo={state.hasLogo} lastPlateCm={state.lastPlateCm} onStarted={setJob} />
    </Card>
  )
}

function Start({ interrupted, onStart }: { interrupted: boolean; onStart: () => void }) {
  return (
    <>
      <p className="text-sm text-muted-foreground">
        {interrupted
          ? 'The last video did not finish sending. Choose it again to start over.'
          : 'Film the dish with a phone, three slow circles around it, and the model is made for you: GLB and USDZ, at its real size.'}
      </p>
      <Button type="button" className="h-11" onClick={onStart}>
        <Video className="mr-2 h-4 w-4" aria-hidden /> Create from a video
      </Button>
    </>
  )
}
