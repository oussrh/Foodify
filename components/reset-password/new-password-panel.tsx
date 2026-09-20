// components/reset-password/new-password-panel.tsx
// What the reset dialog shows once the password is reset: the confirmation, the temporary
// password with its show and copy buttons, its analysis, and the next steps for the admin.
"use client"

import { Check, Shield, Copy, Eye, EyeOff, CheckCircle2, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function NewPasswordPanel({
  newPassword,
  passwordStrength,
  showPassword,
  onToggleShow,
  copied,
  onCopy,
}: {
  newPassword: string | null
  passwordStrength: number
  showPassword: boolean
  onToggleShow: () => void
  copied: boolean
  onCopy: () => void
}) {
  return (
    <>
      {/* Success Message */}
      <div className="p-4 border border-border rounded-md">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-success mb-1">Password Reset Successfully!</p>
            <p className="text-sm text-success">
              The administrator&apos;s password has been reset. They will be required to change it on their next login.
            </p>
          </div>
        </div>
      </div>

      {/* New Password Display */}
      <div className="p-4 border border-border rounded-md">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="h-4 w-4" />
            New Temporary Password
          </p>
          <div className="flex items-center gap-2">
            <Badge className="bg-muted text-success border-border text-xs">
              Strong ({passwordStrength}/5)
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <code className="block p-3 bg-card border-2 border-border rounded-lg text-sm font-mono break-all pr-10">
                {showPassword ? newPassword : '••••••••••••'}
              </code>
              <Button
                onClick={onToggleShow}
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -/2 text-muted-foreground hover:text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              onClick={onCopy}
              variant="outline"
              size="sm"
              className={`transition-colors ${
 copied
 ? "border-border text-success bg-muted"
 : "border-border text-muted-foreground hover:bg-muted"
 }`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {copied && (
            <div className="flex items-center gap-2 p-2 bg-muted border border-border rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <p className="text-sm text-success font-medium">Password copied to clipboard!</p>
            </div>
          )}
        </div>
      </div>

      {/* Password Strength Indicator */}
      {newPassword && (
        <div className="p-4 border border-border rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Password Analysis</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Check className="h-3 w-3" />
              <span>{newPassword.length} characters</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Check className="h-3 w-3" />
              <span>Mixed case letters</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Check className="h-3 w-3" />
              <span>Numbers included</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Check className="h-3 w-3" />
              <span>Special characters</span>
            </div>
          </div>
        </div>
      )}

      {/* Security Instructions */}
      <div className="p-4 border border-border rounded-md">
        <div className="flex items-start gap-3">
          <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">Next Steps</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Share this password securely with the administrator</li>
              <li>• Recommend using encrypted communication</li>
              <li>• Admin must change password on first login</li>
              <li>• Consider enabling two-factor authentication</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
