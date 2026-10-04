// components/capture/capture-form.tsx
// The sheet's form: the plate's diameter, what goes on the model's underside, the video and the
// photos, sent with how the dish was filmed (chosen above it, in the sheet). It is checked against `captureRequest`, the schema the action parses with, before anything
// is sent, and a refusal is tied to the field it is about. When the files arrived but the engine
// would not start, "Start it again" starts the same job without sending the files twice.
'use client'

import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CaptureBase, CaptureView } from '@/lib/capture'
import { captureRequest, type CaptureMode } from '@/lib/schemas/capture'
import { BaseChoice } from './base-choice'
import { CaptureFiles, type FileField } from './capture-files'
import { useStartCapture } from './use-start-capture'

type Props = {
  dishId: string
  restaurantName: string
  hasLogo: boolean
  lastPlateCm: number | null
  mode: CaptureMode
  onStarted: (job: CaptureView) => void
}

type Issue = { field: 'plateCm' | FileField | 'other'; message: string } | null

const described = (file: File) => ({ name: file.name, size: file.size })

/** The request the form describes, or the first thing wrong with it and the field it is about. */
function validate(input: { dishId: string; plate: string; base: CaptureBase; mode: CaptureMode; video: File | null; photos: File[] }) {
  const parsed = captureRequest.safeParse({
    dishId: input.dishId,
    plateCm: Number(input.plate || Number.NaN),
    base: input.base,
    mode: input.mode,
    video: input.video ? described(input.video) : { name: '', size: 0 },
    photos: input.photos.map(described),
  })
  if (parsed.success) return { request: parsed.data, issue: null }
  const first = parsed.error.issues[0]
  const field = first?.path[0]
  const issue: Issue = {
    field: field === 'plateCm' || field === 'video' || field === 'photos' ? field : 'other',
    message: first?.message ?? 'Check the form',
  }
  return { request: null, issue }
}

function Submit({ unstarted, busy, progress, onRetry }: { unstarted: boolean; busy: boolean; progress: number | null; onRetry: () => void }) {
  if (unstarted) {
    return (
      <Button type="button" className="h-12 w-full" disabled={busy} onClick={onRetry}>
        {busy ? 'Starting…' : 'The files were sent: start it again'}
      </Button>
    )
  }
  const label = progress !== null ? `Sending… ${progress}%` : busy ? 'Starting…' : 'Send and create the model'
  return (
    <Button type="submit" className="h-12 w-full" disabled={busy}>
      {label}
    </Button>
  )
}

/** The capture's settings, its video and its photos; `onStarted` gets the capture once the engine has begun. */
export function CaptureForm({ dishId, restaurantName, hasLogo, lastPlateCm, mode, onStarted }: Props) {
  const id = useId()
  const [plate, setPlate] = useState(lastPlateCm === null ? '' : String(lastPlateCm))
  const [base, setBase] = useState<CaptureBase>(hasLogo ? 'LOGO' : 'NAME')
  const [video, setVideo] = useState<File | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [issue, setIssue] = useState<Issue>(null)
  const { start, retry, unstarted, progress, busy } = useStartCapture()
  const issueId = `${id}-issue`

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const { request, issue: found } = validate({ dishId, plate, base, mode, video, photos })
    setIssue(found)
    if (!request || !video) return
    const job = await start(request, video, photos)
    if (job) onStarted(job)
  }

  const again = async () => {
    const job = await retry()
    if (job) onStarted(job)
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-plate`}>Plate diameter (cm)</Label>
        <Input
          id={`${id}-plate`}
          className="h-12 max-w-[10rem]"
          inputMode="decimal"
          type="number"
          min={10}
          max={60}
          step={0.5}
          value={plate}
          onChange={(e) => setPlate(e.target.value)}
          placeholder="27"
          aria-invalid={issue?.field === 'plateCm' || undefined}
          aria-describedby={issue?.field === 'plateCm' ? issueId : undefined}
        />
      </div>
      <BaseChoice name={`${id}-base`} value={base} onChange={setBase} hasLogo={hasLogo} restaurantName={restaurantName} />
      <CaptureFiles id={id} photos={photos} onVideo={setVideo} onPhotos={setPhotos} invalid={issue?.field} issueId={issueId} />
      {issue && (
        <p id={issueId} role="alert" className="text-sm text-destructive">
          {issue.message}
        </p>
      )}
      {progress !== null && <UploadBar progress={progress} />}
      <Submit unstarted={unstarted} busy={busy} progress={progress} onRetry={again} />
    </form>
  )
}

function UploadBar({ progress }: { progress: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-sm bg-muted" role="progressbar" aria-label="Sending the video and photos" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
    </div>
  )
}
