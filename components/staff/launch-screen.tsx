// components/staff/launch-screen.tsx
// The installed app's own launch screen: Basil, the white mark, "Foodizar" and the app's name
// under it. It continues the splash the device drew (Android's from the manifest, iOS's startup
// image) so the app opens as one picture rather than a flash of an empty page, and it is the one
// splash that looks the same on every platform. Rendered on the server so it is there from the
// first paint; CSS shows it only in an installed app's display mode (`.staff-launch` in
// globals.css), and the browser's answer then keeps it (`data-due`) or removes it. It never takes
// focus and never outlasts the app's first data or 1.2 s (use-launch-screen.ts).
'use client'

import { cn } from '@/lib/utils'
import { STAFF_APP_IDENTITY, STAFF_BRAND, type StaffBrandApp } from '@/lib/staff-apps'
import { StaffMark } from './staff-mark'
import { useLaunchScreen } from './use-launch-screen'

/** Covers the installed app on its first load of the session, and fades once `ready` (its first poll answered). */
export function LaunchScreen({ app, ready }: { app: StaffBrandApp; ready: boolean }) {
  const phase = useLaunchScreen(ready)
  if (phase === 'gone') return null

  return (
    <div
      aria-hidden="true"
      data-due={phase === 'server' ? undefined : ''}
      className={cn(
        'staff-launch fixed inset-0 z-[100] flex-col items-center justify-center gap-6 motion-safe:transition-opacity motion-safe:duration-300',
        phase === 'leaving' && 'pointer-events-none opacity-0',
      )}
      style={{ backgroundColor: STAFF_BRAND.color, color: STAFF_BRAND.ink }}
    >
      <StaffMark app={app} className="size-32" />
      <div className="text-center">
        <p className="text-4xl font-bold tracking-tight">{STAFF_BRAND.name}</p>
        <p className="pt-1 text-lg font-medium opacity-85">{STAFF_APP_IDENTITY[app].subtitle}</p>
      </div>
    </div>
  )
}
