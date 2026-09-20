import Link from 'next/link'
import prisma from '@/lib/prisma'
import EditAdminForm, { type EditAdminValues } from '@/components/edit-admin-form'
import ResetAdminPasswordButton from '@/components/reset-admin-password-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Shield, Crown, Calendar, Mail, BarChart3, Settings, Lightbulb, Star } from 'lucide-react'
import { redirect } from 'next/navigation'
import { daysSince } from '@/lib/time'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export default async function EditAdminPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  await requireSuperAdminPage()
  const { id } = await params
  const admin = await prisma.user.findUnique({ where: { id } })
  
  if (!admin) {
    redirect('/admin/admins')
  }
  
  const defaultValues: EditAdminValues = { email: admin.email }
  
  // Calculate admin statistics
  const adminAge = daysSince(admin.createdAt)
  
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
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-md">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Edit Administrator</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium">{admin.email}</span>
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

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Left Column - Edit Form */}
        <div className="xl:col-span-2">
          <EditAdminForm id={admin.id} defaultValues={defaultValues} />
        </div>

        {/* Right Column - Admin Info & Actions */}
        <div className="space-y-6">
          {/* Admin Overview */}
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
                    {new Date(admin.createdAt).toLocaleDateString()}
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

          {/* Quick Actions */}
          <Card className="border-0">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <div className="w-full">
                <ResetAdminPasswordButton id={admin.id} />
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

          {/* Administrator Privileges */}
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
        </div>
      </div>
    </div>
  )
}
