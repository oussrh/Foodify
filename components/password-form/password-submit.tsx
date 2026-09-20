// components/password-form/password-submit.tsx
// The update-password form's submit: disabled until every requirement is met, with the note
// that says which of the two conditions (all requirements, matching confirmation) is missing.
'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowRight, Info, Loader2, Lock } from 'lucide-react'

export default function PasswordSubmit({
  loading,
  strengthScore,
  password,
  confirmPassword,
  passwordsMatch,
}: {
  loading: boolean
  strengthScore: number
  password: string
  confirmPassword: string
  passwordsMatch: string | boolean
}) {
  return (
    <div className="pt-6 space-y-4">
      <Button
        type="submit"
        disabled={loading || strengthScore < 5}
        className="w-full h-12 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors transform hover:scale-[1.02] disabled:"
        size="lg"
      >
        {loading ? (
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Updating Password...</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5" />
            <span>Update Password</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        )}
      </Button>

      {strengthScore < 5 && password && (
        <div className="flex items-center gap-2 justify-center p-3 bg-muted border border-border rounded-lg">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <p className="text-sm text-warning font-medium">
            Please meet all password requirements to continue
          </p>
        </div>
      )}

      {strengthScore === 5 && !passwordsMatch && confirmPassword && (
        <div className="flex items-center gap-2 justify-center p-3 bg-muted border border-border rounded-lg">
          <Info className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-medium">
            Please ensure both passwords match
          </p>
        </div>
      )}
    </div>
  )
}
