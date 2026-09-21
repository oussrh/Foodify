// components/password-form/password-field.tsx
// One password input of the update-password form: its label with an icon, the show/hide
// toggle, the error line, and whatever the form places under it (the strength indicator).
'use client'

import { useState, type ReactNode } from 'react'
import type { FieldError as FieldErrorShape, UseFormRegisterReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function PasswordField({
  id,
  label,
  icon,
  field,
  placeholder,
  error,
  children,
}: {
  id: string
  label: string
  icon: ReactNode
  field: UseFormRegisterReturn
  placeholder: string
  error?: FieldErrorShape | undefined
  children?: ReactNode
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="space-y-3">
      <Label htmlFor={id} className="text-sm font-semibold text-foreground flex items-center gap-2">
        {icon}
        {label}
      </Label>
      <div className="relative group">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          {...field}
          className="pl-4 pr-12 h-12 border-2 border-border focus:border-border-strong focus:ring-4 rounded-md transition-colors group-hover:border-border"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors p-1 rounded-lg hover:bg-muted"
        >
          {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-2 p-3 bg-muted border border-border rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error.message}</p>
        </div>
      )}
      {children}
    </div>
  )
}
