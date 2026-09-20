// PathFile: app/manager/(protected)/change-email/confirm-new/page.tsx
import { confirmNewEmail } from '@/app/actions/profile-actions'
import { CheckCircle, AlertCircle, Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
            Email Confirmation
          </h1>
        </div>

        {/* Content Card */}
        <div className="bg-card border border-border rounded-lg p-8">
          {success ? (
            <div className="space-y-6">
              {/* Success Content */}
              <div className="text-center space-y-4">
                <div className="p-4 bg-muted border border-border rounded-md">
                  <div className="flex items-center gap-3 justify-center">
                    <Mail className="h-5 w-5 text-success dark:text-muted-foreground" />
                    <span className="text-sm font-medium text-success">
                      Email Successfully Updated!
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    Your email has been confirmed
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Your email address has been successfully updated. You can now use your new email to sign in to your account.
                  </p>
                </div>
              </div>

              {/* Next Steps */}
              <div className="p-4 bg-muted border border-border rounded-md">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Next Steps:
                </h3>
                <ul className="text-sm text-muted-foreground dark:text-muted-foreground space-y-1">
                  <li>• Update your saved passwords if using a password manager</li>
                  <li>• Your next login will use the new email address</li>
                  <li>• All account notifications will be sent to your new email</li>
                </ul>
              </div>

              {/* Action Button */}
              <Button asChild className="w-full h-12 bg-primary hover:bg-primary text-white">
                <Link href="/manager/profile">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Return to Profile
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Error Content */}
              <div className="text-center space-y-4">
                <div className="p-4 bg-muted border border-border rounded-md">
                  <div className="flex items-center gap-3 justify-center">
                    <AlertCircle className="h-5 w-5 text-destructive dark:text-muted-foreground" />
                    <span className="text-sm font-medium text-destructive">
                      Confirmation Failed
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    Invalid or expired link
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    The confirmation link you clicked is either invalid or has expired. This may happen if the link is older than 24 hours or has already been used.
                  </p>
                </div>
              </div>

              {/* Help Section */}
              <div className="p-4 bg-muted border border-border rounded-md">
                <h3 className="text-sm font-medium text-warning mb-2">
                  What can you do?
                </h3>
                <ul className="text-sm text-warning dark:text-muted-foreground space-y-1">
                  <li>• Go back to your profile and request a new email change</li>
                  <li>• Check if you have a more recent confirmation email</li>
                  <li>• Contact support if you continue having issues</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/manager/profile">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Profile
                  </Link>
                </Button>
                <Button asChild className="flex-1 bg-primary hover:bg-primary text-white">
                  <Link href="/manager/profile#change-email">
                    <Mail className="h-4 w-4 mr-2" />
                    Try Again
                  </Link>
                </Button>
              </div>
            </div>
          )}
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
