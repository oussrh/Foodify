// components/restaurant-form/device-code-field.tsx
// The restaurant's short code in Settings → General → Basic Information, read-only, with the two
// addresses built from it: the kitchen tablet's board and the waiter's phone. Whoever sets up a
// device reads the code over a shoulder or copies a link into a message; each has its own Copy.
// Absolute from the public origin, like the Info tab's links: they are opened on another device.
'use client'

import { Copy, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCopy } from '@/components/shell/use-copy'
import { publicEnv } from '@/lib/env'
import { deviceLinks } from '@/lib/restaurant-paths'

/** One read-only value with its label and a Copy button (48px, named for what it copies). */
function CopyRow({ id, label, value, describedBy }: { id: string; label: string; value: string; describedBy?: string }) {
  const { copied, copy } = useCopy(label)
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          readOnly
          aria-describedby={describedBy}
          onFocus={(event) => event.currentTarget.select()}
          className="h-12 min-w-0 flex-1 bg-muted font-mono"
        />
        <Button type="button" variant="outline" className="h-12 min-w-12 shrink-0" aria-label={`Copy ${label.toLowerCase()}`} onClick={() => copy(value)}>
          <Copy className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
    </div>
  )
}

/** The restaurant's code and its two device links, each copyable; nothing here is editable, because a code never changes. */
export default function DeviceCodeField({ code }: { code: string }) {
  const links = deviceLinks(publicEnv.appUrl, code)
  return (
    <div className="space-y-4 border-t border-border pt-6">
      <div className="max-w-xs">
        <CopyRow id="restaurant-code" label="Restaurant code" value={code} describedBy="restaurant-code-help" />
      </div>
      <p id="restaurant-code-help" className="flex items-start gap-2 text-sm text-muted-foreground">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Staff type this code, or open the links, to set up the kitchen tablet and the waiter&rsquo;s phone. It never changes.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <CopyRow id="kitchen-link" label="Kitchen tablet link" value={links.kitchen} />
        <CopyRow id="waiter-link" label="Waiter phone link" value={links.waiter} />
      </div>
    </div>
  )
}
