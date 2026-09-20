import { Crown, Key, Lightbulb, Mail, Settings, Shield, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function CreationTipsCard() {
  return (
    <Card className="border-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-destructive" />
          Administrator Creation Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Star className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Strong Passwords</p>
              <p className="text-xs text-muted-foreground">Use at least 8 characters with mixed case, numbers, and symbols</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Star className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">System Access</p>
              <p className="text-xs text-muted-foreground">Super admins have full access to all restaurants and users</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Star className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Security</p>
              <p className="text-xs text-muted-foreground">Only create admin accounts for trusted personnel</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PrivilegesCard() {
  return (
    <Card className="border-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          Administrator Privileges
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="p-3 bg-muted border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-muted text-destructive border-border">
                Full Access
              </Badge>
            </div>
            <p className="text-sm text-destructive">
              <strong>Super Administrator:</strong> Complete system access including user management, restaurant control, and system settings.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Permissions include:</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                <Settings className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">Manage all restaurants and menus</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                <Crown className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">Create and manage admin accounts</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">Access all user data and communications</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                <Key className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">System configuration and security</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** The right column of the administrator create page: creation tips and what a super admin can do. */
export function AdminCreateAside() {
  return (
    <div className="space-y-6">
      <CreationTipsCard />
      <PrivilegesCard />
    </div>
  )
}
