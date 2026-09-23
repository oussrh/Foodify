// components/forms/password-tools.tsx
// Generate and Copy, beside a password an admin sets for somebody else. Generate fills a strong
// random password (lib/password.ts) into the field, where it stays visible, because it is about
// to be handed over; Copy puts it on the clipboard so it is pasted rather than retyped.
'use client'

import { Check, Copy, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { generatePassword } from '@/lib/password'

interface PasswordToolsProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

/** Generate a strong temporary password into the field, and copy what is there. */
export function PasswordTools({ value, onChange, disabled }: PasswordToolsProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy it. Select the password and copy it by hand.')
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => onChange(generatePassword())} disabled={disabled}>
        <Wand2 className="h-4 w-4" aria-hidden="true" />
        Generate
      </Button>
      <Button type="button" variant="outline" size="icon" onClick={copy} disabled={disabled || !value} aria-label={copied ? 'Password copied' : 'Copy password'}>
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      </Button>
    </>
  )
}
