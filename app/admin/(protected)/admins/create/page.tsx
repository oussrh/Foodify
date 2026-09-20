import CreateAdminForm from '@/components/create-admin-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  ArrowLeft,
  Shield,
  UserPlus,
  Crown,
  Lightbulb,
  Star,
  Key,
  Mail,
  Settings
} from 'lucide-react'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export default async function CreateAdminPage() {
  await requireSuperAdminPage()
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild className="hover:bg-muted">
            <Link href="/admin/admins">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admins
            </Link>
          </Button>
        </div>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-md">
            <UserPlus className="h-8 w-8 text-destructive" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Create New Administrator</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium">Super Administrator Account</span>
              <span>•</span>
              <span>Full system access</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Create a new super administrator with complete system access and management privileges
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-muted text-destructive border-border">
              <Crown className="h-3 w-3 mr-1" />
              Super Admin Portal
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Left Column - Create Form */}
        <div className="xl:col-span-2">
          <CreateAdminForm />
        </div>

        {/* Right Column - Info & Tips */}
        <div className="space-y-6">
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
        </div>
      </div>
    </div>
  )
}
