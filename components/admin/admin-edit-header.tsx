import Link from 'next/link'
import { ArrowLeft, Crown, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/** The header of the administrator edit page: the way back, the title, the account line, the portal badge. */
export function AdminEditHeader({ email, adminAge }: { email: string; adminAge: number }) {
  return (
    <div className="border-b border-border pb-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="sm" asChild className="hover:bg-muted">
          <Link href="/admin/admins">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admins
          </Link>
        </Button>
      </div>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-md">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Edit Administrator</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium">{email}</span>
              <span>•</span>
              <span>Super Administrator</span>
              <span>•</span>
              <span>{adminAge} days old</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manage administrator account details and system access
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-muted text-destructive border-border">
            <Crown className="h-3 w-3 mr-1" />
            Super Admin Portal
          </Badge>
        </div>
      </div>
    </div>
  )
}
