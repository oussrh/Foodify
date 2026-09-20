import Link from 'next/link'
import { BarChart3, Calendar, Crown, Lightbulb, Mail, Settings, Shield, Star } from 'lucide-react'
import ResetAdminPasswordButton from '@/components/reset-admin-password-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function AdminOverviewCard({ createdAt, adminAge }: { createdAt: Date; adminAge: number }) {
  return (
    <Card className="border-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-destructive" />
          Administrator Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg border border-border">
            <div className="text-2xl font-bold text-destructive mb-1">FULL</div>
            <div className="text-xs text-destructive">System Access</div>
            <div className="mt-2">
              <Shield className="h-6 w-6 text-destructive mx-auto" />
            </div>
          </div>
        </div>
              
        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex justify-between items-center py-2 px-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Created
            </span>
            <span className="text-sm font-medium text-foreground">
              {new Date(createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 px-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Role
            </span>
            <Badge className="bg-muted text-destructive border-border">
              Super Administrator
            </Badge>
          </div>
          <div className="flex justify-between items-center py-2 px-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Account Age
            </span>
            <span className="text-sm font-medium text-foreground">
              {adminAge} days
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AdminQuickActionsCard({ id }: { id: string }) {
  return (
    <Card className="border-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        <div className="w-full">
          <ResetAdminPasswordButton id={id} />
        </div>
              
        <Button 
          asChild 
          variant="outline"
          className="w-full justify-start border-border text-destructive hover:bg-muted"
        >
          <Link href="/admin/admins">
            <Shield className="h-4 w-4 mr-3" />
            View All Administrators
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function AdminPrivilegesCard() {
  return (
    <Card className="border-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-warning" />
          Administrator Privileges
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Star className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Full System Control</p>
              <p className="text-xs text-muted-foreground">Complete access to all restaurants, users, and settings</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Star className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">User Management</p>
              <p className="text-xs text-muted-foreground">Create, edit, and delete administrator accounts</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Star className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Restaurant Control</p>
              <p className="text-xs text-muted-foreground">Manage all restaurant data, menus, and configurations</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** The right column of the administrator edit page: the overview, the quick actions, the privileges. */
export function AdminEditAside({ id, createdAt, adminAge }: { id: string; createdAt: Date; adminAge: number }) {
  return (
    <div className="space-y-6">
      {/* Admin Overview */}
      <AdminOverviewCard createdAt={createdAt} adminAge={adminAge} />

      {/* Quick Actions */}
      <AdminQuickActionsCard id={id} />

      {/* Administrator Privileges */}
      <AdminPrivilegesCard />
    </div>
  )
}
