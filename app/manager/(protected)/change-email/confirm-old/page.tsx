// PathFile: app/manager/(protected)/change-email/confirm-old/page.tsx
import { confirmOldEmail } from '@/app/actions/profile-actions'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { EmailChangeProgress, OldEmailConfirmed, OldEmailFailed } from '@/components/manager/confirm-old-email'

export default async function ConfirmOldEmailPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const success = params.token ? (await confirmOldEmail(params.token)).confirmed : false

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className={`mx-auto w-16 h-16 rounded-lg flex items-center justify-center ${
 success
 ? ''
 : ''
 }`}>
            {success ? (
              <CheckCircle className="h-8 w-8 text-white" />
            ) : (
              <AlertCircle className="h-8 w-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Email Verification
          </h1>
        </div>

        {/* Content Card */}
        <div className="bg-card border border-border rounded-lg p-8">
          {success ? <OldEmailConfirmed /> : <OldEmailFailed />}
        </div>

        {/* Progress Indicator */}
        {success && <EmailChangeProgress />}

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Need help? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  )
}
