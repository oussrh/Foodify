import Link from 'next/link'
import { BarChart3, Building2, Calendar, ExternalLink, Lightbulb, Mail, Settings, Star } from 'lucide-react'
import SetPasswordButton from '@/components/admin/set-password-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/** What the user's restaurants add up to, for the overview card. */
export interface UserStats {
  totalRestaurants: number
  totalDishes: number
  activeDishes: number
  totalCategories: number
}

function UserOverviewCard({ createdAt, stats }: { createdAt: Date; stats: UserStats }) {
  const { totalRestaurants, totalDishes, activeDishes, totalCategories } = stats
  return (
    <Card className="border-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-success" />
          User Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg border border-border">
            <div className="text-xl font-bold text-muted-foreground">{totalRestaurants}</div>
            <div className="text-xs text-muted-foreground">Restaurants</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg border border-border">
            <div className="text-xl font-bold text-success">{totalDishes}</div>
            <div className="text-xs text-success">Total Dishes</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg border border-border">
            <div className="text-xl font-bold text-muted-foreground">{activeDishes}</div>
            <div className="text-xs text-muted-foreground">Active Dishes</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg border border-border">
            <div className="text-xl font-bold text-warning">{totalCategories}</div>
            <div className="text-xs text-warning">Categories</div>
          </div>
        </div>
              
        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex justify-between items-center py-2 px-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Member Since
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
            <Badge className="bg-muted text-muted-foreground border-border">
              Restaurant Admin
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function UserQuickActionsCard({ id, email, restaurants }: { id: string; email: string; restaurants: { id: string; name: string }[] }) {
  return (
    <Card className="border-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        <Button 
          asChild 
          className="w-full justify-start"
        >
          <Link href={`/admin/users/${id}/restaurants`}>
            <Building2 className="h-4 w-4 mr-3" />
            Manage Restaurant Access
          </Link>
        </Button>
              
        <SetPasswordButton userId={id} email={email} />
              
        {restaurants.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">User&apos;s Restaurants:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {restaurants.map((restaurant) => (
                <Button
                  key={restaurant.id}
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs h-8 border-border hover:bg-muted"
                >
                  <Link
                    href={`/admin/restaurants/${restaurant.id}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    {restaurant.name}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function UserTipsCard() {
  return (
    <Card className="border-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-warning" />
          User Management Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Star className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Email Changes</p>
              <p className="text-xs text-muted-foreground">Users must log in with their new email after changes</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Star className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Restaurant Access</p>
              <p className="text-xs text-muted-foreground">Users can be assigned to multiple restaurants</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Star className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Password Reset</p>
              <p className="text-xs text-muted-foreground">You type the new password and hand it over; ask them to change it</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface UserEditAsideProps {
  id: string
  email: string
  createdAt: Date
  restaurants: { id: string; name: string }[]
  stats: UserStats
}

/** The right column of the user edit page: the overview, the quick actions, the tips. */
export function UserEditAside({ id, email, createdAt, restaurants, stats }: UserEditAsideProps) {
  return (
    <div className="space-y-6">
      {/* User Overview */}
      <UserOverviewCard createdAt={createdAt} stats={stats} />

      {/* Quick Actions */}
      <UserQuickActionsCard id={id} email={email} restaurants={restaurants} />

      {/* Tips */}
      <UserTipsCard />
    </div>
  )
}
