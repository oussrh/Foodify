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
  Key,
  Mail,
  BarChart3,
  ExternalLink,
  Lightbulb,
  Star,
  TrendingUp
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
    restaurantIds: user.restaurants.map((r: any) => r.id),
  }

  // Calculate user statistics
  const totalRestaurants = user.restaurants.length
  const totalDishes = user.restaurants.reduce((acc: number, r: any) => acc + r.dishes.length, 0)
  const activeDishes = user.restaurants.reduce((acc: number, r: any) => acc + r.dishes.filter((d: any) => d.isActive).length, 0)
  const totalCategories = user.restaurants.reduce((acc: number, r: any) => acc + r.categories.length, 0)

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
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Edit User Account</h1>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">{user.email}</span>
                <span>•</span>
                <span>{totalRestaurants} restaurant{totalRestaurants !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{totalDishes} dishes</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Manage user account details and restaurant assignments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              <Shield className="h-3 w-3 mr-1" />
              Admin Portal
            </Badge>
            <Button variant="outline" size="sm" asChild className="border-purple-200 text-purple-600 hover:bg-purple-50">
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
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                User Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xl font-bold text-blue-700">{totalRestaurants}</div>
                  <div className="text-xs text-blue-600">Restaurants</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xl font-bold text-green-700">{totalDishes}</div>
                  <div className="text-xs text-green-600">Total Dishes</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-xl font-bold text-purple-700">{activeDishes}</div>
                  <div className="text-xs text-purple-600">Active Dishes</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-xl font-bold text-orange-700">{totalCategories}</div>
                  <div className="text-xs text-orange-600">Categories</div>
                </div>
              </div>
              
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member Since
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Role
                  </span>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    Restaurant Admin
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button 
                asChild 
                className="w-full justify-start bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
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
                  <p className="text-xs text-gray-500 font-medium">User&apos;s Restaurants:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {user.restaurants.map((restaurant: any) => (
                      <Button
                        key={restaurant.id}
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs h-8 border-gray-200 hover:bg-gray-50"
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
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-600" />
                User Management Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Changes</p>
                    <p className="text-xs text-gray-500">Users must log in with their new email after changes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Restaurant Access</p>
                    <p className="text-xs text-gray-500">Users can be assigned to multiple restaurants</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Password Reset</p>
                    <p className="text-xs text-gray-500">Use the reset button to generate new temporary passwords</p>
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
