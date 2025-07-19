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

export default function CreateAdminPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild className="hover:bg-red-50">
            <Link href="/admin/admins">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admins
            </Link>
          </Button>
        </div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl">
            <UserPlus className="h-8 w-8 text-red-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Create New Administrator</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="font-medium">Super Administrator Account</span>
              <span>•</span>
              <span>Full system access</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Create a new super administrator with complete system access and management privileges
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-100 text-red-700 border-red-200">
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
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-red-600" />
                Administrator Creation Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Strong Passwords</p>
                    <p className="text-xs text-gray-500">Use at least 8 characters with mixed case, numbers, and symbols</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">System Access</p>
                    <p className="text-xs text-gray-500">Super admins have full access to all restaurants and users</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Security</p>
                    <p className="text-xs text-gray-500">Only create admin accounts for trusted personnel</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Administrator Privileges
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      Full Access
                    </Badge>
                  </div>
                  <p className="text-sm text-red-700">
                    <strong>Super Administrator:</strong> Complete system access including user management, restaurant control, and system settings.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium">Permissions include:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                      <Settings className="h-3 w-3 text-gray-400" />
                      <span className="truncate">Manage all restaurants and menus</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                      <Crown className="h-3 w-3 text-gray-400" />
                      <span className="truncate">Create and manage admin accounts</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="truncate">Access all user data and communications</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                      <Key className="h-3 w-3 text-gray-400" />
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
