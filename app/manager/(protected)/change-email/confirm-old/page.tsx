// PathFile: app/manager/(protected)/change-email/confirm-old/page.tsx
import { confirmOldEmail } from '@/app/actions/profile-actions'
import { CheckCircle, AlertCircle, Mail, ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ConfirmOldEmailPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ token?: string }> 
}) {
  const params = await searchParams
  const success = params.token ? await confirmOldEmail(params.token) : false

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
            success 
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
              : 'bg-gradient-to-br from-red-500 to-pink-600'
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
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {success ? (
            <div className="space-y-6">
              {/* Success Content */}
              <div className="text-center space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex items-center gap-3 justify-center">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Old Email Verified!
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground">
                    Step 1 Complete
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Your old email address has been successfully verified. We&apos;ve now sent a confirmation link to your new email address to complete the email change process.
                  </p>
                </div>
              </div>

              {/* Next Steps */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    Next Steps:
                  </h3>
                </div>
                <ol className="text-sm text-amber-800 dark:text-amber-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Check your new email inbox for a confirmation message</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Click the verification link in that email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Your email change will be complete</span>
                  </li>
                </ol>
              </div>

              {/* Important Notice */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                <h3 className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                  Important:
                </h3>
                <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-1">
                  <li>• The confirmation link expires in 24 hours</li>
                  <li>• Check your spam/junk folder if you don&apos;t see the email</li>
                  <li>• You can still access your account with your current email</li>
                </ul>
              </div>

              {/* Action Button */}
              <Button asChild className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                <Link href="/manager/profile">
                  <ArrowLeft className="h-4 w-4 mr-2" />
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
                      Verification Failed
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    Invalid or expired link
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    The verification link you clicked is either invalid or has expired. This may happen if the link is older than 24 hours or has already been used.
                  </p>
                </div>
              </div>

              {/* Help Section */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <h3 className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">
                  What can you do?
                </h3>
                <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                  <li>• Go back to your profile and start the email change process again</li>
                  <li>• Check if you have a more recent verification email</li>
                  <li>• Make sure you&apos;re clicking the correct link from your old email</li>
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
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Try Again
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        {success && (
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email Change Progress
              </span>
              <span className="text-xs text-muted-foreground">1 of 2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-blue-600 dark:text-blue-400 font-medium">✓ Old Email Verified</span>
              <span className="text-muted-foreground">New Email Pending</span>
            </div>
          </div>
        )}

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
