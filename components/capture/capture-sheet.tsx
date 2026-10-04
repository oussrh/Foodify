// components/capture/capture-sheet.tsx
// The sheet "Create from a video" opens: how to film, then the form that sends the video and the
// photos. It comes in from the side, full width on a phone.
'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { CaptureView } from '@/lib/capture'
import { CaptureForm } from './capture-form'
import { CaptureGuide } from './capture-guide'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  dishId: string
  restaurantName: string
  hasLogo: boolean
  lastPlateCm: number | null
  onStarted: (job: CaptureView) => void
}

/** The guide and the form in a sheet; closes itself once the engine has begun. */
export function CaptureSheet({ open, onOpenChange, onStarted, ...form }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Create the 3D model from a video</SheetTitle>
          <SheetDescription>Film the dish as it is served. The model is made from the video in about 15 minutes, and nothing changes on the menu until you accept it.</SheetDescription>
        </SheetHeader>
        <div className="space-y-8 px-4 pb-8">
          <CaptureGuide />
          <CaptureForm
            {...form}
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
