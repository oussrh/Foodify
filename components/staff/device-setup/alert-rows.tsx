// components/staff/device-setup/alert-rows.tsx
// The rest of the sheet: the sound and its test, the buzz and its test, the screen held awake,
// full screen on a tablet in a browser tab. Each says what it is doing right now — "on, but
// waiting for a tap" is a state of its own, because after a reload that is exactly where a
// remembered setting is until somebody touches the screen.
'use client'

import { Expand, Shrink, Sun, Vibrate, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WakeLock } from '@/components/orders/use-wake-lock'
import type { Fullscreen } from '../use-fullscreen'
import { DeviceRow } from './device-row'

/** A screen's sound as the sheet shows it: the remembered switch, the audio's lock, and a test. */
export interface SoundControl {
  on: boolean
  /** On, but the browser has not let the audio play yet: it needs a tap. */
  locked: boolean
  toggle: () => void
  /** Plays the alert once, so someone can check the volume before service. */
  test: () => void
}

const CONTROL = 'h-12 px-4'

/** Sound on or off, and a test of the alert. */
export function SoundRow({ sound }: { sound: SoundControl }) {
  const status = !sound.on ? 'Off' : sound.locked ? 'On: tap anywhere on the screen to let it play' : 'On'
  return (
    <DeviceRow icon={sound.on ? Volume2 : VolumeX} title="Sound" status={status} tone={sound.on && !sound.locked ? 'ok' : sound.on ? 'attention' : 'plain'} note="Check the device is not on silent and its volume is up.">
      <Button variant={sound.on ? 'default' : 'outline'} className={CONTROL} aria-pressed={sound.on} onClick={sound.toggle}>
        {sound.on ? 'Sound on' : 'Sound off'}
      </Button>
      <Button variant="outline" className={CONTROL} onClick={sound.test}>
        Test
      </Button>
    </DeviceRow>
  )
}

/** The buzz, and a test of it; an iPhone is told plainly it has none. */
export function VibrationRow({ supported, test }: { supported: boolean; test: () => void }) {
  if (!supported) {
    return <DeviceRow icon={Vibrate} title="Vibration" status="Not available on this device" note="iPhones give web apps no vibration. Keep the sound on, or watch for the tile." />
  }
  return (
    <DeviceRow icon={Vibrate} title="Vibration" status="On: the phone buzzes when food is up" tone="ok">
      <Button variant="outline" className={CONTROL} onClick={test}>
        Test buzz
      </Button>
    </DeviceRow>
  )
}

/** Keep the screen awake: the remembered choice, and whether the browser is holding it yet. */
export function AwakeRow({ wakeLock }: { wakeLock: WakeLock }) {
  if (!wakeLock.supported) {
    return <DeviceRow icon={Sun} title="Keep screen on" status="Not supported by this browser" note="Set a long screen timeout in the device's display settings instead." />
  }
  const status = !wakeLock.on ? 'Off: the screen sleeps on the device’s timer' : wakeLock.held ? 'On: the screen stays awake on this page' : 'On: tap anywhere on the screen to hold it'
  return (
    <DeviceRow icon={Sun} title="Keep screen on" status={status} tone={wakeLock.on ? (wakeLock.held ? 'ok' : 'attention') : 'plain'} note="Remembered on this device, including after a reload.">
      <Button variant={wakeLock.on ? 'default' : 'outline'} className={CONTROL} aria-pressed={wakeLock.on} onClick={wakeLock.toggle}>
        {wakeLock.on ? 'Screen on' : 'Keep awake'}
      </Button>
    </DeviceRow>
  )
}

/** Full screen, for a tablet using the app in a browser tab. */
export function FullscreenRow({ fullscreen }: { fullscreen: Fullscreen }) {
  return (
    <DeviceRow icon={Expand} title="Full screen" status={fullscreen.active ? 'On' : 'Off'} note="Hides the browser's bars. Installing the app does this for good.">
      <Button variant="outline" className={CONTROL} onClick={fullscreen.toggle}>
        {fullscreen.active ? <Shrink className="h-5 w-5" aria-hidden="true" /> : <Expand className="h-5 w-5" aria-hidden="true" />}
        {fullscreen.active ? 'Exit full screen' : 'Full screen'}
      </Button>
    </DeviceRow>
  )
}
