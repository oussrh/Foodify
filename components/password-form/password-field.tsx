// components/password-form/password-field.tsx
// One password input of the update-password form: its label, the show/hide toggle, the error
// line, and whatever the form places under it (the requirements list).
'use client'

import { useState, type ReactNode } from 'react'
import type { FieldError as FieldErrorShape, UseFormRegisterReturn } from 'react-hook-form'
import { Eye, EyeOff } from 'lucide-react'
import FieldError from '@/components/forms/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * One password input of the update-password form: its label, a show/hide toggle, the error line,
 * and whatever the form places beneath it (the requirements list).
 */
export default function PasswordField({
  id,
  label,
  autoComplete,
  field,
  error,
  children,
}: {
  id: string
  label: string
  /** `current-password` or `new-password`: what a password manager fills here. */
  autoComplete: 'current-password' | 'new-password'
  field: UseFormRegisterReturn
  error?: FieldErrorShape | undefined
  children?: ReactNode
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type={show ? 'text' : 'password'} autoComplete={autoComplete} {...field} className="pr-10" />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      <FieldError error={error} />
      {children}
    </div>
  )
}
