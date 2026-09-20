// components/reset-password/reset-intro.tsx
// What the reset dialog says before the reset: the security notice and the four properties
// of the password it will generate.
import { AlertTriangle, Shield, Lock, RefreshCw, UserCheck, Clock } from "lucide-react"

export default function ResetIntro() {
  return (
    <>
      {/* Warning Section */}
      <div className="p-4 border border-border rounded-md">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-warning mb-1">Important Security Notice</p>
            <p className="text-sm text-warning">
              This will generate a new random password for the administrator.
              The admin will be required to change their password on the next login.
            </p>
          </div>
        </div>
      </div>

      {/* Security Features */}
      <div className="p-4 border border-border rounded-md">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <Shield className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">Security Features</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>12-character length</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                <span>Cryptographically random</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <UserCheck className="h-3 w-3" />
                <span>Forced password change</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Immediate activation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
