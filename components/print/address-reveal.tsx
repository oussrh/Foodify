// components/print/address-reveal.tsx
// A printer's address, shown once, right after it was made (a new printer, or a new address for
// one): the only time it can be read, since only its hash is kept. With it, the few steps that put
// it into an Epson printer.
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { printerAddress } from '@/lib/print/view'
import { publicEnv } from '@/lib/env'

/** Where the address goes in the printer's own settings page (Epson Server Direct Print). */
const STEPS = [
  'Find the printer’s IP address: turn it off, hold the Feed button while turning it on, and it prints its settings.',
  'On a computer or tablet on the same network, open that IP address in a browser and sign in to the printer’s settings.',
  'Open Server Direct Print, turn it on, paste this address as URL 1, set its interval to 5 seconds, and save. No ID or password is needed: the address is the key.',
  'Come back here and press “Test page”.',
]

/** The one-time address of a printer, a copy button, and the setup steps; `onDone` hides it. */
export function AddressReveal({ name, token, onDone }: { name: string; token: string; onDone: () => void }) {
  const address = printerAddress(publicEnv.appUrl, token)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-card px-5 py-4" role="status">
      <p className="text-sm font-medium">The address of “{name}”. Copy it now: it is not shown again.</p>
      <code className="break-all rounded-sm bg-muted px-3 py-2 text-sm">{address}</code>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        {STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <Button className="h-12" onClick={() => void copy()}>
          {copied ? 'Copied' : 'Copy address'}
        </Button>
        <Button variant="ghost" className="h-12" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  )
}
