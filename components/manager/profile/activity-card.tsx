// components/manager/profile/activity-card.tsx
// The account's last activity-log entries: an email change and where it stands, a password
// change, the second factor turned on or off (profile-actions writes them).
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ActivityEntry {
  id: string
  action: string
  createdAt: Date
  status: string
}

const ACTION_LABEL: Record<string, string> = {
  email_change_initiated: 'Email change',
  password_changed: 'Password changed',
  two_factor_enabled: 'Two-factor authentication turned on',
  two_factor_disabled: 'Two-factor authentication turned off',
}

/** An email change's steps; a finished one ("done", "confirmed_new") needs no badge. */
const IN_PROGRESS: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  pending: { label: 'Awaiting old address', variant: 'warning' },
  confirmed_old: { label: 'Awaiting new address', variant: 'warning' },
}

const MOMENT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }

export function ActivityCard({ activity }: { activity: ActivityEntry[] }) {
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>The last changes made to this account.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {activity.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">Nothing yet. Changes to your email, password and two-factor setting are listed here.</p>
        ) : (
          <ul className="divide-y divide-border">
            {activity.map((entry) => {
              const step = IN_PROGRESS[entry.status]
              return (
                <li key={entry.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{ACTION_LABEL[entry.action] ?? entry.action}</p>
                    <p className="tnum text-xs text-muted-foreground">{entry.createdAt.toLocaleString('en-GB', MOMENT)}</p>
                  </div>
                  {step && <Badge variant={step.variant}>{step.label}</Badge>}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
