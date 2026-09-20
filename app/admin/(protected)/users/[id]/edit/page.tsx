import Link from 'next/link'
import prisma from '@/lib/prisma'
import EditClientForm, { type EditClientValues } from '@/components/edit-client-form'
import ResetPasswordButton from '@/components/reset-password-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  User,
  Shield,
  Building2,
  Calendar,
  Settings,
  Mail,
  BarChart3,
  ExternalLink,
  Lightbulb,
  Star,
} from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    include: { 
      restaurants: {
        include: {
          dishes: {
            select: {
              id: true,
              isActive: true
            }
          },
          categories: {
            select: {
              id: true
            }
          }
        }
      }
    },
  })
  
  if (!user) {
    redirect('/admin/users')
  }
  
  const restaurants = await prisma.restaurant.findMany({ orderBy: { name: 'asc' } })
  const defaultValues: EditClientValues = {
    email: user.email,
    restaurantIds: user.restaurants.map((r) => r.id),
  }

  // Calculate user statistics
  const totalRestaurants = user.restaurants.length
  const totalDishes = user.restaurants.reduce((acc, r) => acc + r.dishes.length, 0)
  const activeDishes = user.restaurants.reduce((acc, r) => acc + r.dishes.filter((d) => d.isActive).length, 0)
  const totalCategories = user.restaurants.reduce((acc, r) => acc + r.categories.length, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild className="hover:bg-muted">
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-md">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Edit User Account</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium">{user.email}</span>
                <span>•</span>
                <span>{totalRestaurants} restaurant{totalRestaurants !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{totalDishes} dishes</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Manage user account details and restaurant assignments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-muted text-muted-foreground border-border">
              <Shield className="h-3 w-3 mr-1" />
              Admin Portal
            </Badge>
            <Button variant="outline" size="sm" asChild className="border-border text-muted-foreground hover:bg-muted">
              <Link href={`/admin/users/${user.id}/restaurants`}>
                <Building2 className="h-4 w-4 mr-2" />
                Manage Restaurants
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Left Column - Edit Form */}
        <div className="xl:col-span-2">
          <EditClientForm
            id={user.id}
            defaultValues={defaultValues}
            restaurants={restaurants}
          />
        </div>

        {/* Right Column - User Info & Actions */}
        <div className="space-y-6">
          {/* User Overview */}
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
                    {new Date(user.createdAt).toLocaleDateString()}
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

          {/* Quick Actions */}
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
                <Link href={`/admin/users/${user.id}/restaurants`}>
                  <Building2 className="h-4 w-4 mr-3" />
                  Manage Restaurant Access
                </Link>
              </Button>
              
              <div className="w-full">
                <ResetPasswordButton id={user.id} />
              </div>
              
              {user.restaurants.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">User&apos;s Restaurants:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {user.restaurants.map((restaurant) => (
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

          {/* Tips */}
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
                    <p className="text-xs text-muted-foreground">Use the reset button to generate new temporary passwords</p>
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
