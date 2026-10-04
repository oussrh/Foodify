// components/capture/capture-sheet.tsx
// The sheet "Create from a video" opens: how the dish is filmed, how to film it that way, then the
// form that sends the video and the photos. It comes in from the side, full width on a phone.
'use client'

import { useId, useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { CaptureView } from '@/lib/capture'
import type { CaptureMode } from '@/lib/schemas/capture'
import { CaptureForm } from './capture-form'
import { CaptureGuide } from './capture-guide'
import { ModeChoice } from './mode-choice'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  dishId: string
  restaurantName: string
  hasLogo: boolean
  lastPlateCm: number | null
  lastMode: CaptureMode | null
  onStarted: (job: CaptureView) => void
}

/** The mode, its guide and the form in a sheet, opening on the mode last used; closes itself once the engine has begun. */
export function CaptureSheet({ open, onOpenChange, onStarted, lastMode, ...form }: Props) {
  const id = useId()
  const [mode, setMode] = useState<CaptureMode>(lastMode ?? 'WALKAROUND')
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Create the 3D model from a video</SheetTitle>
          <SheetDescription>Film the dish as it is served. The model is made from the video in about 15 minutes, and nothing changes on the menu until you accept it.</SheetDescription>
        </SheetHeader>
        <div className="space-y-8 px-4 pb-8">
          <ModeChoice name={`${id}-mode`} value={mode} onChange={setMode} />
          <CaptureGuide mode={mode} />
          <CaptureForm
            {...form}
            mode={mode}
            onStarted={(job) => {
              onStarted(job)
              onOpenChange(false)
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
