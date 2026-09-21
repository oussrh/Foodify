// components/client-form/edit-account-fields.tsx
// The "Account Information" section of the edit-administrator form: the email with its
// Changed badge, error line and the notice that a new address changes how the user signs in.
'use client'

import type { FieldError as FieldErrorShape, UseFormRegisterReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Mail, AlertCircle, Shield } from 'lucide-react'

export default function EditAccountFields({
  email,
  error,
  hasEmailChanged,
  disabled,
}: {
  email: UseFormRegisterReturn
  error?: FieldErrorShape | undefined
  hasEmailChanged: boolean
  disabled: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <div className="p-2 bg-muted rounded-lg">
          <Shield className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Account Information</h3>
          <p className="text-sm text-muted-foreground">Basic account credentials and login details</p>
        </div>
      </div>

      {/* Email */}
      <div className="space-y-3">
        <Label htmlFor="email" className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Email Address
        </Label>
        <div className="relative">
          <Input
            id="email"
            {...email}
            className="h-12"
            placeholder="admin@restaurant.com"
            disabled={disabled}
          />
          {hasEmailChanged && (
            <div className="absolute right-3 top-1/2 transform -/2">
              <Badge className="bg-muted text-warning dark:text-muted-foreground border-border text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Changed
              </Badge>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-muted border border-border rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive dark:text-muted-foreground">{error.message}</p>
          </div>
        )}

        {hasEmailChanged && (
          <div className="p-4 border border-border rounded-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning dark:text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">Email Address Change</p>
                <p className="text-sm text-warning dark:text-muted-foreground mt-1">
                  The user will need to log in with the new email address. They should update their saved login credentials.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
