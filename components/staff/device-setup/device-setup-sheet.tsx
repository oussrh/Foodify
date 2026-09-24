// components/staff/device-setup/device-setup-sheet.tsx
// "This device": everything a staff screen can ask of the hardware it runs on, in one place, each
// with its live state and the one tap that grants or tests it. It is set up once, by whoever puts
// the tablet on the pass or hands out the phone, and then left alone — which is why it lives
// behind one button rather than in the header, and why every setting in it is remembered by the
// device rather than the account.
//
// The notifications hook lives here rather than in the sheet's content: the content mounts only
// while the sheet is open, and an existing subscription must be saved again on every load.
'use client'

import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { WakeLock } from '@/components/orders/use-wake-lock'
import { useFullscreen } from '../use-fullscreen'
import { usePushSubscription } from '../use-push-subscription'
import type { StaffPushApp } from '@/lib/schemas/push'
import type { StaffPwa } from '../use-staff-pwa'
import { AwakeRow, FullscreenRow, SoundRow, VibrationRow, type SoundControl } from './alert-rows'
import { InstallRow } from './install-row'
import { PushRow } from './push-row'

interface DeviceSetupSheetProps {
  /** The restaurant's uuid, which a notification subscription is saved against. */
  restaurantId: string
  app: StaffPushApp
  pwa: StaffPwa
  sound: SoundControl
  /** The board's; a phone in a pocket does not want its screen held on. */
  wakeLock?: WakeLock | undefined
  /** The waiter's buzz; a tablet on a stand has nothing to feel it. */
  vibration?: { supported: boolean; test: () => void } | undefined
}

/**
 * The "This device" button and its sheet: install, notifications, sound, vibration, the screen
 * held awake and full screen, each with its state and the tap that grants or tests it.
 */
export function DeviceSetupSheet({ restaurantId, app, pwa, sound, wakeLock, vibration }: DeviceSetupSheetProps) {
  const push = usePushSubscription(restaurantId, app)
  const fullscreen = useFullscreen()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-12 min-w-12 px-3" aria-label="This device's settings">
          <Settings2 className="h-5 w-5" aria-hidden="true" />
          <span className="hidden md:inline">Device</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="overflow-y-auto px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-5 sm:mx-auto sm:max-w-xl"
      >
        <SheetHeader className="pr-10">
          <SheetTitle>This device</SheetTitle>
          <SheetDescription>Remembered on this device only. Set it up once, before service.</SheetDescription>
        </SheetHeader>
        <ul className="pt-2">
          <InstallRow pwa={pwa} />
          <PushRow push={push} app={app} />
          <SoundRow sound={sound} />
          {vibration && <VibrationRow supported={vibration.supported} test={vibration.test} />}
          {wakeLock && <AwakeRow wakeLock={wakeLock} />}
          {fullscreen.supported && !pwa.installed && <FullscreenRow fullscreen={fullscreen} />}
        </ul>
        <SheetClose asChild>
          <Button variant="outline" className="mt-2 h-12 w-full">
            Done
          </Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  )
}
