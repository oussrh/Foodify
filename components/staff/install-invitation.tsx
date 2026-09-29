// components/staff/install-invitation.tsx
// The invitation to put the app on the home screen, once per device, on the first screen after the
// sign-in: the browser's own install prompt on Android and desktop Chrome, Safari's Share steps on
// an iPhone or iPad. "Not now" is remembered by the device, as installing is by the display mode;
// either way it does not come back. The device sheet's install row stays for later.
'use client'

import { useId } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClientValue } from '@/components/use-client-value'
import { STAFF_APP_IDENTITY, type StaffBrandApp } from '@/lib/staff-apps'
import { installInvitation } from '@/lib/staff-device'
import { AddToHomeSteps } from './add-to-home-steps'
import { readAppleMobile } from './device-facts'
import { StaffMark } from './staff-mark'
import { useDeviceSetting } from './use-device-setting'
import type { StaffPwa } from './use-staff-pwa'

/** One remembered "not now" per app: a device that runs two of them is asked about each. */
const DISMISSED_KEY: Record<StaffBrandApp, string> = {
  waiter: 'foodizar-install-dismissed-waiter',
  kitchen: 'foodizar-install-dismissed-kitchen',
  orders: 'foodizar-install-dismissed-orders',
}

/** The install card: the app's icon, its name, and the one way this device installs it; nothing once installed or dismissed. */
export function InstallInvitation({ app, pwa }: { app: StaffBrandApp; pwa: StaffPwa }) {
  const titleId = useId()
  const appleMobile = useClientValue(readAppleMobile, false)
  const [dismissed, setDismissed] = useDeviceSetting(DISMISSED_KEY[app], false)
  const kind = installInvitation({ installed: pwa.installed, dismissed, canInstall: pwa.canInstall, appleMobile })
  if (!kind) return null

  return (
    <section aria-labelledby={titleId} className="mb-4 rounded-lg border border-border bg-card p-4 sm:max-w-xl">
      <div className="flex items-start gap-3">
        <StaffMark app={app} tile className="size-12 shrink-0" />
        <div className="min-w-0 flex-1 text-sm">
          <h2 id={titleId} className="text-base font-semibold">
            Install {STAFF_APP_IDENTITY[app].name}
          </h2>
          <p className="pb-2 text-muted-foreground">
            It opens full screen from its own icon, straight onto this screen, without the browser around it.
          </p>
          {kind === 'share-steps' && <AddToHomeSteps />}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-3">
        <Button variant="ghost" className="h-12 px-4" onClick={() => setDismissed(true)}>
          Not now
        </Button>
        {kind === 'prompt' && (
          <Button className="h-12 px-4" onClick={pwa.install}>
            <Download className="h-5 w-5" aria-hidden="true" />
            Install
          </Button>
        )}
      </div>
    </section>
  )
}
