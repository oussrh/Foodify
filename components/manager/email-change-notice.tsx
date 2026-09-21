import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

// The pieces both steps of the email change (confirm-old, confirm-new) build their cards from.

const TONE = {
  muted: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
} as const

/** The one-line status box at the top of a confirmation card: an icon and a short verdict. */
export function StatusBanner({ icon: Icon, tone, children }: { icon: LucideIcon; tone: 'muted' | 'success' | 'destructive'; children: string }) {
  return (
    <div className="p-4 bg-muted border border-border rounded-md">
      <div className="flex items-center gap-3 justify-center">
        <Icon className={`h-5 w-5 ${TONE[tone]} dark:text-muted-foreground`} />
        <span className={`text-sm font-medium ${TONE[tone]}`}>{children}</span>
      </div>
    </div>
  )
}

/** A titled box of bullet points: next steps, an important notice, what to do about a failure. */
export function BulletNotice({ title, tone, items }: { title: string; tone: 'muted' | 'warning'; items: readonly string[] }) {
  return (
    <div className="p-4 bg-muted border border-border rounded-md">
      <h3 className={`text-sm font-medium ${TONE[tone]} mb-2`}>{title}</h3>
      <ul className={`text-sm ${TONE[tone]} dark:text-muted-foreground space-y-1`}>
        {items.map((item) => (
          <li key={item}>{`• ${item}`}</li>
        ))}
      </ul>
    </div>
  )
}

interface EmailLinkFailedProps {
  /** The verdict in the status box. */
  banner: string
  /** What happened, under "Invalid or expired link". */
  explanation: string
  /** What the manager can do about it. */
  tips: readonly string[]
  /** The icon on the "Try Again" button. */
  retryIcon: LucideIcon
}

/** The card for a confirmation link that no longer works: what happened, what to do, back or try again. */
export function EmailLinkFailed({ banner, explanation, tips, retryIcon: RetryIcon }: EmailLinkFailedProps) {
  return (
    <div className="space-y-6">
      {/* Error Content */}
      <div className="text-center space-y-4">
        <StatusBanner icon={AlertCircle} tone="destructive">
          {banner}
        </StatusBanner>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Invalid or expired link
          </h2>
          <p className="text-sm text-muted-foreground">{explanation}</p>
        </div>
      </div>

      {/* Help Section */}
      <BulletNotice title="What can you do?" tone="warning" items={tips} />

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
            <RetryIcon className="h-4 w-4 mr-2" />
            Try Again
          </Link>
        </Button>
      </div>
    </div>
  )
}
