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
          {success ? (
            <div className="space-y-6">
              {/* Success Content */}
              <div className="text-center space-y-4">
                <div className="p-4 bg-muted border border-border rounded-md">
                  <div className="flex items-center gap-3 justify-center">
                    <Mail className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
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
              <div className="p-4 bg-muted border border-border rounded-md">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-warning dark:text-muted-foreground" />
                  <h3 className="text-sm font-medium text-warning">
                    Next Steps:
                  </h3>
                </div>
                <ol className="text-sm text-warning dark:text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 w-5 h-5 bg-muted text-warning dark:text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Check your new email inbox for a confirmation message</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 w-5 h-5 bg-muted text-warning dark:text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Click the verification link in that email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 w-5 h-5 bg-muted text-warning dark:text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Your email change will be complete</span>
                  </li>
                </ol>
              </div>

              {/* Important Notice */}
              <div className="p-4 bg-muted border border-border rounded-md">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Important:
                </h3>
                <ul className="text-sm text-muted-foreground dark:text-muted-foreground space-y-1">
                  <li>• The confirmation link expires in 24 hours</li>
                  <li>• Check your spam/junk folder if you don&apos;t see the email</li>
                  <li>• You can still access your account with your current email</li>
                </ul>
              </div>

              {/* Action Button */}
              <Button asChild className="w-full h-12 bg-primary hover:bg-primary text-white">
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
                <div className="p-4 bg-muted border border-border rounded-md">
                  <div className="flex items-center gap-3 justify-center">
                    <AlertCircle className="h-5 w-5 text-destructive dark:text-muted-foreground" />
                    <span className="text-sm font-medium text-destructive">
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
              <div className="p-4 bg-muted border border-border rounded-md">
                <h3 className="text-sm font-medium text-warning mb-2">
                  What can you do?
                </h3>
                <ul className="text-sm text-warning dark:text-muted-foreground space-y-1">
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
                <Button asChild className="flex-1 bg-primary hover:bg-primary text-white">
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
          <div className="bg-card border border-border rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Email Change Progress
              </span>
              <span className="text-xs text-muted-foreground">1 of 2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-muted-foreground dark:text-muted-foreground font-medium">✓ Old Email Verified</span>
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
