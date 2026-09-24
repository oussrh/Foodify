// components/staff/device-setup/install-row.tsx
// Putting the app on the home screen, the way each device does it. Android and desktop Chrome
// offer a prompt, which the button opens. An iPhone or iPad has no prompt at all — Safari's Share
// menu is the only way — so it gets the two steps, with the share icon drawn as Safari draws it.
// Installed matters beyond tidiness: on iOS it is what makes notifications possible.
'use client'

import { Download, Share, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClientValue } from '@/components/use-client-value'
import type { StaffPwa } from '../use-staff-pwa'
import { readAppleMobile } from '../device-facts'
import { DeviceRow } from './device-row'

/** The install line: installed, the browser's prompt, or Safari's Share → Add to Home Screen steps. */
export function InstallRow({ pwa }: { pwa: StaffPwa }) {
  const appleMobile = useClientValue(readAppleMobile, false)

  if (pwa.installed) return <DeviceRow icon={Smartphone} title="Home screen app" status="Installed: opened from the home screen" tone="ok" />

  if (pwa.canInstall) {
    return (
      <DeviceRow icon={Smartphone} title="Home screen app" status="Not installed" note="Opens full screen, without the browser's bars, and starts straight on this page.">
        <Button className="h-12 px-4" onClick={pwa.install}>
          <Download className="h-5 w-5" aria-hidden="true" />
          Install
        </Button>
      </DeviceRow>
    )
  }

  if (appleMobile) {
    return (
      <DeviceRow
        icon={Smartphone}
        title="Home screen app"
        status="Not installed"
        tone="attention"
        note={
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              In Safari, tap Share <Share className="inline h-4 w-4 align-text-bottom" aria-hidden="true" />
              <span className="sr-only">(the square with an arrow pointing up)</span>
            </li>
            <li>Choose “Add to Home Screen”, then open the app from its icon.</li>
          </ol>
        }
      />
    )
  }

  return (
    <DeviceRow
      icon={Smartphone}
      title="Home screen app"
      status="Not installed"
      note="Use the browser's menu: “Install app” or “Add to Home screen”."
    />
  )
}
