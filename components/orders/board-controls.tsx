// components/orders/board-controls.tsx
// What this particular device does, as opposed to what the board shows: install itself, hold the
// screen awake, make a noise, look again now. They are the tablet's settings and they sit apart
// from the view switch for that reason — a second pair of hands changing one does not change what
// anybody else's board is showing.
//
// Every control is at least 48px, because it is pressed with a thumb, often with one hand,
// sometimes with a glove.
'use client'

import { Bell, BellOff, Download, RefreshCw, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { StaffPwa } from '@/components/staff/use-staff-pwa'
import type { WakeLock } from './use-wake-lock'

interface BoardControlsProps {
  loading: boolean
  onRefresh: () => void
  /** Whether this tablet makes a noise when an order arrives; remembered on the device. */
  soundOn: boolean
  onToggleSound: () => void
  wakeLock: WakeLock
  pwa: StaffPwa
  /** The "This device" button: install, notifications, sound test, full screen. */
  deviceSetup: React.ReactNode
}

const CONTROL = 'h-12 min-w-12 px-3'

/**
 * This tablet's own switches (install, keep the screen awake, sound, refresh), kept apart from the
 * view switch because they change this device only.
 */
export default function BoardControls({ loading, onRefresh, soundOn, onToggleSound, wakeLock, pwa, deviceSetup }: BoardControlsProps) {
  return (
    <>
      {pwa.canInstall && (
        <Button onClick={pwa.install} className={CONTROL}>
          <Download className="h-5 w-5" />
          <span className="hidden md:inline">Install</span>
        </Button>
      )}

      {wakeLock.supported && (
        <Button
          variant={wakeLock.on ? 'default' : 'outline'}
          onClick={wakeLock.toggle}
          aria-pressed={wakeLock.on}
          aria-label="Keep awake"
          className={CONTROL}
          title={wakeLock.on && !wakeLock.held ? 'On: tap anywhere to hold the screen' : 'Keep the screen awake'}
        >
          <Sun className="h-5 w-5" />
          <span className="hidden md:inline">Keep awake</span>
        </Button>
      )}

      {/* A switch, not a demonstration: it decides whether the next order makes a sound and stays
          quiet itself. Turning it on is the gesture the browser needs to let audio play at all. */}
      <Button
        variant="outline"
        onClick={onToggleSound}
        className={CONTROL}
        aria-pressed={soundOn}
        aria-label={soundOn ? 'Sound on — tap to silence the board' : 'Sound off — tap to hear new orders'}
        title={soundOn ? 'Sound on' : 'Sound off'}
      >
        {soundOn ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
        <span className="hidden md:inline">{soundOn ? 'Sound on' : 'Sound off'}</span>
      </Button>

      {deviceSetup}

      <Button variant="outline" onClick={onRefresh} aria-label="Check for new orders now" className={CONTROL}>
        <RefreshCw className={cn('h-5 w-5', loading && 'animate-spin')} />
      </Button>
    </>
  )
}
