import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import UpdatePasswordForm from '@/components/update-password-form'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Activity, 
  Settings, 
  ChevronRight,
  Clock,
  MapPin,
  Smartphone,
  Monitor
} from 'lucide-react'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { 
      email: true, 
      createdAt: true, 
      lastLogin: true,
      role: true,
      emailVerified: true,
      restaurants: {
        select: {
          id: true,
          name: true,
          createdAt: true
        }
      }
    },
  })

  if (!user) {
    return <div className="py-12 text-center text-muted-foreground">User not found</div>
  }

  const recentActivity = await prisma.activityLog.findMany({
    where: { userId: session.user.id },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      action: true,
      createdAt: true,
      ipAddress: true,
      status: true
    }
  })

  const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  const isNewAccount = accountAge < 30
  
  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          Account Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings, security, and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Account Overview */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Account Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Email Address</p>
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.emailVerified ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                        Unverified
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Shield className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Account Role</p>
                    <Badge className="mt-1 bg-blue-100 text-blue-700 border-blue-200">
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Member Since</p>
                    <p className="text-sm text-gray-600">{user.createdAt.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                    {isNewAccount && (
                      <Badge className="mt-1 bg-green-100 text-green-700 border-green-200">
                        New Account
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Last Login</p>
                    <p className="text-sm text-gray-600">
                      {user.lastLogin ? user.lastLogin.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Quick Actions</h4>
              <div className="grid gap-2 md:grid-cols-2">
                <Link href="/manager/change-email">
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Change Email
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Account Settings
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Account Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{accountAge}</div>
              <div className="text-sm text-blue-700">Days Active</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{user.restaurants.length}</div>
              <div className="text-sm text-green-700">Restaurant{user.restaurants.length !== 1 ? 's' : ''}</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{recentActivity.length}</div>
              <div className="text-sm text-purple-700">Recent Activities</div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UpdatePasswordForm />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">
                        {activity.action.replace(/_/g, ' ')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {activity.createdAt.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {activity.ipAddress && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <p className="text-xs text-gray-500">{activity.ipAddress}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge 
                      className={
                        activity.status === 'confirmed_new' ? 'bg-green-100 text-green-700 border-green-200' :
                        activity.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Restaurants */}
        {user.restaurants.length > 0 && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-indigo-600" />
                My Restaurants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {user.restaurants.map((restaurant) => (
                  <div key={restaurant.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{restaurant.name}</h4>
                        <p className="text-sm text-gray-500">
                          Created {restaurant.createdAt.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <Link href={`/manager/restaurants/${restaurant.id}`}>
                        <Button variant="outline" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
