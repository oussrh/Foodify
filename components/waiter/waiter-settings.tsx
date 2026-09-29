// components/waiter/waiter-settings.tsx
// The waiter's "This device" sheet for a screen that does not already run the phone's alert: the
// Orders tab. The Tables screen owns the alert (it buzzes when a table goes ready) and passes its
// own controls to the sheet; this one builds the same controls from the same remembered settings,
// so the theme, the sound and the install are reachable from every tab, not only the first.
'use client'

import { DeviceSetupSheet } from '@/components/staff/device-setup/device-setup-sheet'
import { useAudioUnlock } from '@/components/staff/use-audio-unlock'
import { useStaffPwa } from '@/components/staff/use-staff-pwa'
import { useReadyAlert } from './use-ready-alert'

/** The waiter's device settings, for a screen that has no alert of its own. */
export function WaiterSettings({ restaurantId }: { restaurantId: string }) {
  const alert = useReadyAlert()
  const audio = useAudioUnlock(alert.soundOn)
  const pwa = useStaffPwa()
  return (
    <DeviceSetupSheet
      restaurantId={restaurantId}
      app="waiter"
      pwa={pwa}
      sound={{ on: alert.soundOn, locked: audio.locked, toggle: alert.toggleSound, test: alert.test }}
      vibration={{ supported: alert.canVibrate, test: alert.buzz }}
      labelled
    />
  )
}
