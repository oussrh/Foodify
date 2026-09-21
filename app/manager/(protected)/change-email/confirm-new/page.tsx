// PathFile: app/manager/(protected)/change-email/confirm-new/page.tsx
import { confirmNewEmail } from '@/app/actions/profile-actions'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { NewEmailConfirmed, NewEmailFailed } from '@/components/manager/confirm-new-email'

export default async function ConfirmNewEmailPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const success = params.token ? (await confirmNewEmail(params.token)).confirmed : false

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-lg flex items-center justify-center">
            {success ? (
              <CheckCircle className="h-8 w-8 text-white" />
            ) : (
              <AlertCircle className="h-8 w-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Email Confirmation
          </h1>
        </div>

        {/* Content Card */}
        <div className="bg-card border border-border rounded-lg p-8">
          {success ? <NewEmailConfirmed /> : <NewEmailFailed />}
        </div>

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
