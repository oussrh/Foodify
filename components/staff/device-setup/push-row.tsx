// components/staff/device-setup/push-row.tsx
// Notifications, said honestly for each state a device can be in (`pushAvailability`). Most of
// the states are not "off" but "cannot yet", and each says what would change that: install it
// first on an iPhone, update iOS, undo a refusal in the device's settings — because a browser
// never shows its permission prompt twice, and a button that silently does nothing is worse
// than no button.
'use client'

import { BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PushAvailability } from '@/lib/staff-device'
import type { PushControl } from '../use-push-subscription'
import type { StaffPushApp } from '@/lib/schemas/push'
import { DeviceRow, type RowTone } from './device-row'

/** What a notification tells this app about. */
const ABOUT: Record<StaffPushApp, string> = { board: 'new orders', waiter: 'food that is ready' }

const BLOCKED = (
  <ul className="list-disc space-y-1 pl-5">
    <li>Android: long-press the app icon → App info → Notifications, or tap the icon beside the address in Chrome → Permissions.</li>
    <li>iPhone and iPad: Settings → Notifications → this app.</li>
  </ul>
)

/** The status line, its tone and any note, for each state that has no button. */
const EXPLAINED: Partial<Record<PushAvailability, { status: string; tone: RowTone; note?: React.ReactNode }>> = {
  development: { status: 'Not available in development', tone: 'plain', note: 'The app’s background worker runs on the live site only.' },
  unconfigured: { status: 'Not configured', tone: 'plain', note: 'This site has no push key yet; an administrator sets one.' },
  'install-first': { status: 'Install the app first', tone: 'attention', note: 'An iPhone or iPad can be asked for notifications only from the home screen app (iOS 16.4 or later). Add it to the Home Screen above, open it from there, and come back here.' },
  'update-ios': { status: 'Needs iOS 16.4 or later', tone: 'attention', note: 'Update in Settings → General → Software Update.' },
  unsupported: { status: 'Not supported by this browser', tone: 'plain', note: 'Chrome on Android, or the home screen app on iOS 16.4 or later, can receive them.' },
  denied: { status: 'Blocked on this device', tone: 'attention', note: <>The browser will not ask again. To allow them: {BLOCKED}</> },
}

/** Notifications for this device: why they cannot be had yet, or the tap that turns them on or off. */
export function PushRow({ push, app }: { push: PushControl; app: StaffPushApp }) {
  const explained = EXPLAINED[push.availability]
  const error = push.error && <p role="alert" className="text-destructive">{push.error}</p>

  if (explained) return <DeviceRow icon={BellRing} title="Notifications" status={explained.status} tone={explained.tone} note={explained.note} />

  if (push.availability === 'on') {
    return (
      <DeviceRow icon={BellRing} title="Notifications" status="On" tone="ok" note={error || `This device is told about ${ABOUT[app]}, even with the app closed.`}>
        <Button variant="outline" className="h-12 px-4" onClick={push.turnOff} disabled={push.busy}>
          Turn off
        </Button>
      </DeviceRow>
    )
  }

  return (
    <DeviceRow
      icon={BellRing}
      title="Notifications"
      status="Off"
      note={error || `Be told about ${ABOUT[app]} when the app is closed or the screen is off.${push.availability === 'ask' ? ' The device will ask you to allow them.' : ''}`}
    >
      <Button className="h-12 px-4" onClick={push.turnOn} disabled={push.busy}>
        {push.busy ? 'Turning on…' : 'Turn on'}
      </Button>
    </DeviceRow>
  )
}
