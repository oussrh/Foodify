import Link from 'next/link'
import prisma from '@/lib/prisma'
import CreateClientForm from '@/components/create-client-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  UserPlus,
  Shield,
  Building2,
  Users,
  Lightbulb,
  Star
} from 'lucide-react'

export default async function CreateUserPage() {
  const restaurants = await prisma.restaurant.findMany({ orderBy: { name: 'asc' } })
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild className="hover:bg-blue-50">
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
        </div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
            <UserPlus className="h-8 w-8 text-green-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Create New User</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="font-medium">Restaurant Administrator</span>
              <span>•</span>
              <span>{restaurants.length} restaurants available</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Create a new restaurant administrator account with access permissions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              <Shield className="h-3 w-3 mr-1" />
              Admin Portal
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Left Column - Create Form */}
        <div className="xl:col-span-2">
          <CreateClientForm restaurants={restaurants} />
        </div>

        {/* Right Column - Info & Tips */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                User Creation Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Strong Passwords</p>
                    <p className="text-xs text-gray-500">Use at least 8 characters with mixed case and numbers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Restaurant Access</p>
                    <p className="text-xs text-gray-500">Assign users to existing restaurants or create new ones</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                    <p className="text-xs text-gray-500">Users will receive login credentials via email</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                Available Restaurants
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      {restaurants.length} Available
                    </Badge>
                  </div>
                  <p className="text-sm text-green-700">
                    <strong>Restaurant Assignment:</strong> You can assign the new user to existing restaurants or create a new restaurant during setup.
                  </p>
                </div>
                
                {restaurants.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Recent restaurants:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {restaurants.slice(0, 5).map((restaurant: any) => (
                        <div key={restaurant.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          <span className="truncate">{restaurant.name}</span>
                        </div>
                      ))}
                      {restaurants.length > 5 && (
                        <p className="text-xs text-gray-400 text-center pt-1">
                          +{restaurants.length - 5} more available
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
