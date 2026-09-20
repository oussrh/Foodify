import Link from 'next/link'
import { Activity, Building2, Calendar, ChevronRight, Eye, Globe, MapPin, Shield, TrendingUp } from 'lucide-react'
import UpdatePasswordForm from '@/components/update-password-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ActivityEntry {
  action: string
  createdAt: Date
  ipAddress: string | null
  status: string
}

interface ProfileRestaurant {
  id: string
  name: string
  createdAt: Date
  slug: string
}

/** Three figures: days active, restaurants, recent activities. */
export function AccountStatsCard({ accountAge, restaurantCount, activityCount }: { accountAge: number; restaurantCount: number; activityCount: number }) {
  return (
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
          <div className="text-3xl font-bold text-success dark:text-muted-foreground">{restaurantCount}</div>
          <div className="text-sm text-success dark:text-muted-foreground font-medium">Restaurant{restaurantCount !== 1 ? 's' : ''}</div>
        </div>
            
        <div className="text-center p-4 rounded-md border border-border">
          <div className="text-3xl font-bold text-muted-foreground dark:text-muted-foreground">{activityCount}</div>
          <div className="text-sm text-muted-foreground dark:text-muted-foreground font-medium">Recent Activities</div>
        </div>
      </CardContent>
    </Card>
  )
}

/** The password form, full width. */
export function SecurityCard() {
  return (
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
  )
}

/** The last activity-log entries, or the empty state. */
export function RecentActivityCard({ activity }: { activity: ActivityEntry[] }) {
  return (
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
        {activity.length > 0 ? (
          <div className="space-y-3">
            {activity.map((activity, index) => (
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
  )
}

/** The restaurants the account manages, one tile each with the way to its page. */
export function MyRestaurantsCard({ restaurants }: { restaurants: ProfileRestaurant[] }) {
  return (
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
          {restaurants.map((restaurant) => (
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
                <Link href={`/manager/restaurants/${restaurant.id}/info`}>
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
  )
}
