// components/shell/use-copy.ts
// The one Copy action of the staff screens: a link on the Info tab, a table's QR link, the
// restaurant's code and its device links in Settings. Each puts its value on the clipboard, says
// so in a toast and on the button for a few seconds, and on a browser that refuses says that too,
// because the value is on screen to be copied by hand.
'use client'

import { useState } from 'react'
import { toast } from 'sonner'

/** How long the button says Copied. */
const COPIED_FOR_MS = 3000

/**
 * A copy action for values named `label` ("Link", "Restaurant code"): `copy(value)` writes it to the
 * clipboard with a toast either way, and `copied` is true for a few seconds after a success.
 */
export function useCopy(label: string): { copied: boolean; copy: (value: string) => Promise<void> } {
  const [copied, setCopied] = useState(false)
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), COPIED_FOR_MS)
      toast.success(`${label} copied`)
    } catch {
      toast.error(`Could not copy the ${label.toLowerCase()}`, { description: 'Select it and copy it by hand.' })
    }
  }
  return { copied, copy }
}
