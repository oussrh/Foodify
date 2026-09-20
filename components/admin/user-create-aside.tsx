import { Building2, Lightbulb, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/** What the aside needs of a restaurant: its key and its name. */
interface AsideRestaurant {
  id: string
  name: string
}

function CreationTipsCard() {
  return (
    <Card className="border-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-muted-foreground" />
          User Creation Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Star className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Strong Passwords</p>
              <p className="text-xs text-muted-foreground">Use at least 8 characters with mixed case and numbers</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Star className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Restaurant Access</p>
              <p className="text-xs text-muted-foreground">Assign users to existing restaurants or create new ones</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Star className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Users will receive login credentials via email</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AvailableRestaurantsCard({ restaurants }: { restaurants: AsideRestaurant[] }) {
  return (
    <Card className="border-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-success" />
          Available Restaurants
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="p-3 bg-muted border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-muted text-success border-border">
                {restaurants.length} Available
              </Badge>
            </div>
            <p className="text-sm text-success">
              <strong>Restaurant Assignment:</strong> You can assign the new user to existing restaurants or create a new restaurant during setup.
            </p>
          </div>

          {restaurants.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Recent restaurants:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {restaurants.slice(0, 5).map((restaurant) => (
                  <div key={restaurant.id} className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{restaurant.name}</span>
                  </div>
                ))}
                {restaurants.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{restaurants.length - 5} more available
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/** The right column of the manager create page: creation tips and the restaurants a new manager can be assigned to. */
export function UserCreateAside({ restaurants }: { restaurants: AsideRestaurant[] }) {
  return (
    <div className="space-y-6">
      <CreationTipsCard />
      <AvailableRestaurantsCard restaurants={restaurants} />
    </div>
  )
}
