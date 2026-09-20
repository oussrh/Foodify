import Link from 'next/link'
import { CheckCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BulletNotice, EmailLinkFailed, StatusBanner } from '@/components/manager/email-change-notice'

const NEXT_STEPS = [
  'Update your saved passwords if using a password manager',
  'Your next login will use the new email address',
  'All account notifications will be sent to your new email',
]

const FAILED_TIPS = [
  'Go back to your profile and request a new email change',
  'Check if you have a more recent confirmation email',
  'Contact support if you continue having issues',
]

/** Step 2 done: the new address is confirmed and is now the account's email. */
export function NewEmailConfirmed() {
  return (
    <div className="space-y-6">
      {/* Success Content */}
      <div className="text-center space-y-4">
        <StatusBanner icon={Mail} tone="success">
          Email Successfully Updated!
        </StatusBanner>

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
      <BulletNotice title="Next Steps:" tone="muted" items={NEXT_STEPS} />

      {/* Action Button */}
      <Button asChild className="w-full h-12 bg-primary hover:bg-primary text-white">
        <Link href="/manager/profile">
          <CheckCircle className="h-4 w-4 mr-2" />
          Return to Profile
        </Link>
      </Button>
    </div>
  )
}

/** The link was invalid or expired: what happened and what to do. */
export function NewEmailFailed() {
  return (
    <EmailLinkFailed
      banner="Confirmation Failed"
      explanation="The confirmation link you clicked is either invalid or has expired. This may happen if the link is older than 24 hours or has already been used."
      tips={FAILED_TIPS}
      retryIcon={Mail}
    />
  )
}
