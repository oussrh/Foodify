// components/client-form/create-account-fields.tsx
// The "Account Information" section of the create-administrator form: the email and the
// temporary password, each with its error line.
'use client'

import type { FieldError as FieldErrorShape, UseFormRegisterReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock } from 'lucide-react'
import FieldError from '@/components/forms/field-error'

export default function CreateAccountFields({
  email,
  password,
  errors,
  disabled,
}: {
  email: UseFormRegisterReturn
  password: UseFormRegisterReturn // abatty:allow-secret (a field registration, not a value)
  errors: { email?: FieldErrorShape; password?: FieldErrorShape }
  disabled: boolean
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground border-b pb-2">Account Information</h3>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Address
        </Label>
        <Input
          id="email"
          {...email}
          className="border-border focus:border-border-strong"
          placeholder="admin@restaurant.com"
          disabled={disabled}
        />
        <FieldError error={errors.email} />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Password
        </Label>
        <Input
          id="password"
          type="password"
          {...password}
          className="border-border focus:border-border-strong"
          placeholder="Minimum 6 characters"
          disabled={disabled}
        />
        <FieldError error={errors.password} />
      </div>
    </div>
  )
}
