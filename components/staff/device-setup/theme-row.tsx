// components/staff/device-setup/theme-row.tsx
// Light, dark, or whatever the device is set to: the same choice as the header's sun/moon button,
// with the third option the button cannot offer. Staff screens start light (components/theme-provider.tsx)
// and the choice is remembered on this device, like everything else in the sheet.
'use client'

import { useTheme } from 'next-themes'
import { Moon, MonitorSmartphone, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClientValue } from '@/components/use-client-value'
import { themeStatus } from '../theme-status'
import { DeviceRow } from './device-row'

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Follow the device' },
] as const

/** The screen's theme: light, dark, or following the device's own setting. */
export function ThemeRow() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  // Nothing is pressed on the server render: the stored choice is known only in the browser.
  const mounted = useClientValue(() => true, false)
  const current = mounted ? theme : undefined
  const resolved = mounted ? resolvedTheme : undefined

  return (
    <DeviceRow icon={resolved === 'dark' ? Moon : Sun} title="Theme" status={themeStatus(current, resolved)}>
      <div role="group" aria-label="Theme" className="flex flex-wrap gap-2">
        {OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={current === option.value ? 'default' : 'outline'}
            className="h-12 px-4"
            aria-pressed={current === option.value}
            onClick={() => setTheme(option.value)}
          >
            {option.value === 'system' && <MonitorSmartphone className="h-5 w-5" aria-hidden="true" />}
            {option.label}
          </Button>
        ))}
      </div>
    </DeviceRow>
  )
}
