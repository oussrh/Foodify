import Link from 'next/link'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Utensils, ChefHat, BarChart3, Eye, Plus, Settings } from 'lucide-react'

export default async function ManagerDashboard() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  // Get restaurants for this manager
  const restaurants = await prisma.restaurant.findMany({
    where: { users: { some: { email: session.user.email } } },
    include: {
      dishes: {
        select: {
          id: true,
          isActive: true,
          views: true,
        }
      },
      categories: {
        select: {
          id: true,
        }
      }
    }
  })

  // Calculate stats
  const restaurantCount = restaurants.length
  const totalDishes = restaurants.reduce((sum, r) => sum + r.dishes.length, 0)
  const activeDishes = restaurants.reduce((sum, r) => sum + r.dishes.filter(d => d.isActive).length, 0)
  const totalViews = restaurants.reduce((sum, r) => 
    sum + r.dishes.reduce((dishSum, d) => dishSum + d.views.length, 0), 0)
  const totalCategories = restaurants.reduce((sum, r) => sum + r.categories.length, 0)

  const stats = [
    { icon: Utensils, label: 'Restaurants', value: restaurantCount, href: '/manager/restaurants' },
    { icon: ChefHat, label: 'Total Dishes', value: totalDishes, href: '#' },
    { icon: BarChart3, label: 'Active Dishes', value: activeDishes, href: '#' },
    { icon: Eye, label: 'Total Views', value: totalViews, href: '#' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your restaurants.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, href }) => (
          <Card key={label} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground">
                {label === 'Restaurants' && restaurantCount === 1 ? 'restaurant' : 
                 label === 'Total Dishes' ? 'across all restaurants' :
                 label === 'Active Dishes' ? 'currently available' :
                 'from all dishes'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <Card key={restaurant.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{restaurant.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {restaurant.dishes.length} dishes • {restaurant.categories.length} categories
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" asChild>
                    <Link href={`/manager/restaurants/${restaurant.id}/menu`}>
                      <ChefHat className="h-4 w-4 mr-1" />
                      Menu
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/manager/restaurants/${restaurant.id}/edit`}>
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          
          {restaurants.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No restaurants assigned to your account.</p>
              <p className="text-sm text-muted-foreground">Contact your administrator to get restaurant access.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Activity tracking coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
