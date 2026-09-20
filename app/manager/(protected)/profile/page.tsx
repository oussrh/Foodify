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
  Building2,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Globe,
  Zap,
  Star,
  Eye,
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
          <div className="p-3 rounded-lg">
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
        <div className={`p-4 rounded-md border ${
 user.emailVerified 
 ? 'bg-muted border-border' 
 : 'bg-muted border-border'
 }`}>
          <div className="flex items-center gap-3">
            {user.emailVerified ? (
              <CheckCircle className="h-5 w-5 text-success dark:text-muted-foreground" />
            ) : (
              <AlertCircle className="h-5 w-5 text-warning dark:text-muted-foreground" />
            )}
            <div>
              <p className={`text-sm font-medium ${
 user.emailVerified 
 ? 'text-success' 
 : 'text-warning'
 }`}>
                {user.emailVerified ? 'Account Verified' : 'Email Verification Required'}
              </p>
              <p className={`text-sm ${
 user.emailVerified 
 ? 'text-success dark:text-muted-foreground' 
 : 'text-warning dark:text-muted-foreground'
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
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <User className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
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
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-md border border-border/50">
                  <div className="p-2 bg-background rounded-lg border border-border/50">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Email Address</p>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.emailVerified ? (
                      <Badge className="bg-muted text-success dark:text-muted-foreground border-border">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-border text-warning dark:text-muted-foreground bg-muted">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-md border border-border/50">
                  <div className="p-2 bg-background rounded-lg border border-border/50">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Account Role</p>
                    <div className="mt-2">
                      <Badge className="bg-muted text-muted-foreground dark:text-muted-foreground border-border">
                        <Star className="h-3 w-3 mr-1" />
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-md border border-border/50">
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
                      <Badge className="bg-muted text-success dark:text-muted-foreground border-border mt-2">
                        <Zap className="h-3 w-3 mr-1" />
                        New Account
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-md border border-border/50">
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
                  <Button variant="outline" className="w-full justify-between h-12 hover:bg-accent hover:border-accent-foreground/20 transition-colors">
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
                
                <Button variant="outline" className="w-full justify-between h-12 hover:bg-accent hover:border-accent-foreground/20 transition-colors">
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
        <Card className="">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <TrendingUp className="h-5 w-5 text-success dark:text-muted-foreground" />
              </div>
              <span>Account Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="text-center p-4 rounded-md border border-border">
              <div className="text-3xl font-bold text-muted-foreground dark:text-muted-foreground">{accountAge}</div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground font-medium">Days Active</div>
            </div>
            
            <div className="text-center p-4 rounded-md border border-border">
              <div className="text-3xl font-bold text-success dark:text-muted-foreground">{user.restaurants.length}</div>
              <div className="text-sm text-success dark:text-muted-foreground font-medium">Restaurant{user.restaurants.length !== 1 ? 's' : ''}</div>
            </div>
            
            <div className="text-center p-4 rounded-md border border-border">
              <div className="text-3xl font-bold text-muted-foreground dark:text-muted-foreground">{recentActivity.length}</div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground font-medium">Recent Activities</div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings - Full width */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Shield className="h-5 w-5 text-destructive dark:text-muted-foreground" />
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
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Activity className="h-5 w-5 text-warning dark:text-muted-foreground" />
              </div>
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-muted/30 rounded-md border border-border/50 hover:bg-muted/50 transition-colors">
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
                        activity.status === 'confirmed_new' ? 'bg-muted text-success dark:text-muted-foreground border-border' :
                        activity.status === 'pending' ? 'bg-muted text-warning dark:text-muted-foreground border-border' :
                        'bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground border-border '
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
          <Card className="lg:col-span-3">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Building2 className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
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
                  <div key={restaurant.id} className="group p-6 border border-border rounded-md transition-colors hover:border-accent-foreground/20">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg">
                            <Building2 className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
                          </div>
                          <h4 className="font-semibold text-foreground group-hover:text-muted-foreground dark:group-hover:text-muted-foreground transition-colors">
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
                        <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-colors">
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
