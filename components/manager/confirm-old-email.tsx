import Link from 'next/link'
import { ArrowLeft, ArrowRight, Clock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BulletNotice, EmailLinkFailed, StatusBanner } from '@/components/manager/email-change-notice'

const IMPORTANT = [
  'The confirmation link expires in 24 hours',
  "Check your spam/junk folder if you don't see the email",
  'You can still access your account with your current email',
]

const FAILED_TIPS = [
  'Go back to your profile and start the email change process again',
  'Check if you have a more recent verification email',
  "Make sure you're clicking the correct link from your old email",
  'Contact support if you continue having issues',
]

/** Step 1 done: the old address is verified, the link to the new one is on its way. */
export function OldEmailConfirmed() {
  return (
    <div className="space-y-6">
      {/* Success Content */}
      <div className="text-center space-y-4">
        <StatusBanner icon={Mail} tone="muted">
          Old Email Verified!
        </StatusBanner>

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
      <BulletNotice title="Important:" tone="muted" items={IMPORTANT} />

      {/* Action Button */}
      <Button asChild className="w-full h-12 bg-primary hover:bg-primary text-white">
        <Link href="/manager/profile">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Profile
        </Link>
      </Button>
    </div>
  )
}

/** The link was invalid or expired: what happened and what to do. */
export function OldEmailFailed() {
  return (
    <EmailLinkFailed
      banner="Verification Failed"
      explanation="The verification link you clicked is either invalid or has expired. This may happen if the link is older than 24 hours or has already been used."
      tips={FAILED_TIPS}
      retryIcon={ArrowRight}
    />
  )
}

/** The two-step progress strip shown under a confirmed step 1. */
export function EmailChangeProgress() {
  return (
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
  )
}
