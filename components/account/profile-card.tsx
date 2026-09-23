// components/account/profile-card.tsx
// The facts of the signed-in account, one row each: the address and whether it is verified,
// the role, when the account was made, when it last signed in. Shared by both portals; only
// the manager portal has a change-email flow to link to.
import Link from 'next/link'
import type { Route } from 'next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { roleLabel } from '@/lib/roles'

interface ProfileCardProps {
  email: string
  emailVerified: Date | null
  role: string
  createdAt: Date
  lastLogin: Date | null
  /** Where the address can be changed; left out when the portal has no such flow. */
  changeEmailHref?: Route
}

const DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
const MOMENT: Intl.DateTimeFormatOptions = { ...DAY, hour: '2-digit', minute: '2-digit' }

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm">{children}</dd>
    </div>
  )
}

/**
 * The Account page's read-only facts: address and whether it is verified, role, creation date, last
 * sign-in. The Change email link shows only when the portal passes where to go.
 */
export function ProfileCard({ email, emailVerified, role, createdAt, lastLogin, changeEmailHref }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <dl className="divide-y divide-border">
          <Row term="Email">
            <span className="truncate font-medium">{email}</span>
            {emailVerified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Unverified</Badge>}
            {changeEmailHref && (
              <Button asChild size="sm" variant="outline" className="ml-auto">
                <Link href={changeEmailHref}>Change email</Link>
              </Button>
            )}
          </Row>
          <Row term="Role">{roleLabel(role)}</Row>
          <Row term="Member since">
            <span className="tnum">{createdAt.toLocaleDateString('en-GB', DAY)}</span>
          </Row>
          <Row term="Last sign-in">
            <span className="tnum">{lastLogin ? lastLogin.toLocaleString('en-GB', MOMENT) : 'Never'}</span>
          </Row>
        </dl>
      </CardContent>
    </Card>
  )
}
