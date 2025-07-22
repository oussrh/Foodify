// PathFile: app/manager/(protected)/profile/page.tsx
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
  Monitor,
  Building2,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Globe,
  Zap,
  Star,
  Eye
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
          createdAt: true,
          slug: true
        }
      }
    },
  })

  if (!user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <User className="h-12 w-12 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">User not found</h3>
            <p className="text-sm text-muted-foreground">The requested user profile could not be located.</p>
          </div>
        </div>
      </div>
    )
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
  }).catch(() => []) // Fallback if activityLog table doesn't exist

  const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  const isNewAccount = accountAge < 30
  
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Account Profile
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your account settings, security, and preferences
            </p>
          </div>
        </div>
        
        {/* Account Status Banner */}
        <div className={`p-4 rounded-xl border ${
          user.emailVerified 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        }`}>
          <div className="flex items-center gap-3">
            {user.emailVerified ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            )}
            <div>
              <p className={`text-sm font-medium ${
                user.emailVerified 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-amber-800 dark:text-amber-200'
              }`}>
                {user.emailVerified ? 'Account Verified' : 'Email Verification Required'}
              </p>
              <p className={`text-sm ${
                user.emailVerified 
                  ? 'text-green-600 dark:text-green-300' 
                  : 'text-amber-600 dark:text-amber-300'
              }`}>
                {user.emailVerified 
                  ? 'Your account is fully verified and secure' 
                  : 'Please verify your email address to secure your account'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Account Overview - Spans 2 columns */}
        <Card className="lg:col-span-2 card-enhanced">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-border">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className="text-lg">Account Overview</span>
                <p className="text-sm text-muted-foreground font-normal mt-0.5">
                  Your account details and basic information
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Profile Info */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border/50">
                  <div className="p-2 bg-background rounded-lg border border-border/50">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Email Address</p>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.emailVerified ? (
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border/50">
                  <div className="p-2 bg-background rounded-lg border border-border/50">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Account Role</p>
                    <div className="mt-2">
                      <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                        <Star className="h-3 w-3 mr-1" />
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border/50">
                  <div className="p-2 bg-background rounded-lg border border-border/50">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Member Since</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {user.createdAt.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    {isNewAccount && (
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 mt-2">
                        <Zap className="h-3 w-3 mr-1" />
                        New Account
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border/50">
                  <div className="p-2 bg-background rounded-lg border border-border/50">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Last Login</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
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
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Quick Actions
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                <Link href="/manager/change-email">
                  <Button variant="outline" className="w-full justify-between h-12 hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200">
                    <span className="flex items-center gap-3">
                      <Mail className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Change Email</div>
                        <div className="text-xs text-muted-foreground">Update your email address</div>
                      </div>
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                
                <Button variant="outline" className="w-full justify-between h-12 hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200">
                  <span className="flex items-center gap-3">
                    <Settings className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Account Settings</div>
                      <div className="text-xs text-muted-foreground">Manage preferences</div>
                    </div>
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Stats */}
        <Card className="card-enhanced">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-border">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span>Account Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{accountAge}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Days Active</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{user.restaurants.length}</div>
              <div className="text-sm text-green-700 dark:text-green-300 font-medium">Restaurant{user.restaurants.length !== 1 ? 's' : ''}</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{recentActivity.length}</div>
              <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">Recent Activities</div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings - Full width */}
        <Card className="lg:col-span-3 card-enhanced">
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-b border-border">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <span className="text-lg">Security & Privacy</span>
                <p className="text-sm text-muted-foreground font-normal mt-0.5">
                  Keep your account secure with strong password protection
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <UpdatePasswordForm />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 card-enhanced">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-b border-border">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="p-2 bg-background rounded-lg border border-border/50">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize text-foreground">
                        {activity.action.replace(/_/g, ' ')}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {activity.createdAt.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {activity.ipAddress && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">{activity.ipAddress}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge 
                      className={
                        activity.status === 'confirmed_new' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' :
                        activity.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      }
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No recent activity</h3>
                <p className="text-sm">Your account activity will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Restaurants */}
        {user.restaurants.length > 0 && (
          <Card className="lg:col-span-3 card-enhanced">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-border">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                  <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <span className="text-lg">My Restaurants</span>
                  <p className="text-sm text-muted-foreground font-normal mt-0.5">
                    Restaurants you have access to manage
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {user.restaurants.map((restaurant) => (
                  <div key={restaurant.id} className="group p-6 border border-border rounded-xl hover:shadow-lg transition-all duration-300 hover:border-accent-foreground/20 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg">
                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h4 className="font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {restaurant.name}
                          </h4>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Created {restaurant.createdAt.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          {restaurant.slug && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Globe className="h-3 w-3" />
                              /{restaurant.slug}
                            </p>
                          )}
                        </div>
                      </div>
                      <Link href={`/manager/restaurants/${restaurant.id}` as any}>
                        <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                          <ChevronRight className="h-4 w-4 ml-1" />
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
