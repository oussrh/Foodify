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
  const success = params.token ? await confirmNewEmail(params.token) : false

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
            success 
              ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
              : 'bg-gradient-to-br from-red-500 to-pink-600'
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
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {success ? (
            <div className="space-y-6">
              {/* Success Content */}
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-center gap-3 justify-center">
                    <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
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
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                  Next Steps:
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• Update your saved passwords if using a password manager</li>
                  <li>• Your next login will use the new email address</li>
                  <li>• All account notifications will be sent to your new email</li>
                </ul>
              </div>

              {/* Action Button */}
              <Button asChild className="w-full h-12 bg-green-600 hover:bg-green-700 text-white shadow-lg">
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
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="flex items-center gap-3 justify-center">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">
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
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <h3 className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">
                  What can you do?
                </h3>
                <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
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
                <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
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
