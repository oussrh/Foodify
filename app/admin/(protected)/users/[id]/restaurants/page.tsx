import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { 
  MoreVertical, 
  ArrowLeft,
  User,
  Building2,
  Shield,
  Settings,
  Calendar,
  Mail,
  BarChart3,
  Edit,
  ExternalLink,
  ChefHat,
  Utensils,
  Users,
  Target,
  TrendingUp,
  Plus,
  Lightbulb,
  Star
} from 'lucide-react'
import AssignRestaurantsDialog from '@/components/assign-restaurants-dialog'
import RemoveUserRestaurantButton from '@/components/remove-user-restaurant-button'
import Image from 'next/image'

export default async function UserRestaurantsPage({
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
              isActive: true,
              price: true
            }
          },
          categories: {
            select: {
              id: true
            }
          },
          users: {
            select: {
              id: true,
              role: true
            }
          }
        }
      }
    },
  })

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="border-0 shadow-lg max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-6">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
                <User className="h-10 w-10 text-red-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">User Not Found</h3>
                <p className="text-gray-500">The user you're looking for doesn't exist or has been deleted.</p>
              </div>
              <Button asChild className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                <Link href="/admin/users">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Users
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate statistics
  const totalRestaurants = user.restaurants.length
  const totalDishes = user.restaurants.reduce((acc: number, r: any) => acc + r.dishes.length, 0)
  const activeDishes = user.restaurants.reduce((acc: number, r: any) => acc + r.dishes.filter((d: any) => d.isActive).length, 0)
  const totalCategories = user.restaurants.reduce((acc: number, r: any) => acc + r.categories.length, 0)
  const totalManagers = user.restaurants.reduce((acc: number, r: any) => acc + r.users.filter((u: any) => u.role === 'RESTAURANT_ADMIN').length, 0)
  const totalValue = user.restaurants.reduce((acc: number, r: any) => acc + r.dishes.reduce((dishAcc: number, d: any) => dishAcc + Number(d.price || 0), 0), 0)

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
          <Button variant="ghost" size="sm" asChild className="hover:bg-purple-50">
            <Link href={`/admin/users/${user.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Link>
          </Button>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Restaurant Management</h1>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span className="font-medium">{user.email}</span>
                <span>•</span>
                <span>{totalRestaurants} restaurant{totalRestaurants !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{totalDishes} dishes</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Manage restaurant assignments and access permissions for this user
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              <Shield className="h-3 w-3 mr-1" />
              Admin Portal
            </Badge>
            <AssignRestaurantsDialog
              userId={user.id}
              defaultRestaurantIds={user.restaurants.map((r: any) => r.id)}
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Restaurants</p>
                <p className="text-3xl font-bold text-gray-900">{totalRestaurants}</p>
                <p className="text-xs text-purple-600 mt-1">Assigned venues</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Dishes</p>
                <p className="text-3xl font-bold text-gray-900">{totalDishes}</p>
                <p className="text-xs text-green-600 mt-1">{activeDishes} active</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <ChefHat className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-3xl font-bold text-gray-900">{totalCategories}</p>
                <p className="text-xs text-orange-600 mt-1">Menu sections</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Co-Managers</p>
                <p className="text-3xl font-bold text-gray-900">{totalManagers}</p>
                <p className="text-xs text-blue-600 mt-1">Other admins</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-3xl font-bold text-gray-900">${totalValue.toFixed(0)}</p>
                <p className="text-xs text-emerald-600 mt-1">All menus</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restaurants Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Assigned Restaurants</h2>
            <p className="text-sm text-gray-500 mt-1">
              {totalRestaurants === 0 
                ? 'No restaurants assigned to this user' 
                : `User has access to ${totalRestaurants} restaurant${totalRestaurants !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>

        {user.restaurants.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center space-y-6">
                <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-purple-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">No Restaurants Assigned</h3>
                  <p className="text-gray-500 max-w-sm">
                    This user doesn't have access to any restaurants yet. Assign restaurants to grant management permissions.
                  </p>
                </div>
                <AssignRestaurantsDialog
                  userId={user.id}
                  defaultRestaurantIds={user.restaurants.map((r: any) => r.id)}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {user.restaurants.map((restaurant: any) => {
              const activeDishes = restaurant.dishes.filter((d: any) => d.isActive).length
              const totalRestaurantDishes = restaurant.dishes.length
              const totalRestaurantCategories = restaurant.categories.length
              const restaurantValue = restaurant.dishes.reduce((acc: number, d: any) => acc + Number(d.price || 0), 0)
              const coManagers = restaurant.users.filter((u: any) => u.role === 'RESTAURANT_ADMIN' && u.id !== user.id).length
              
              return (
                <Card key={restaurant.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1">
                  <div className="aspect-video relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    {restaurant.logoUrl ? (
                      <>
                        <Image
                          src={restaurant.logoUrl}
                          alt={restaurant.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-100 to-indigo-100">
                        <div className="text-center space-y-2">
                          <Building2 className="h-12 w-12 text-purple-500 mx-auto" />
                          <span className="text-sm text-purple-600 font-medium">No logo</span>
                        </div>
                      </div>
                    )}
                    
                    {/* User access badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        <User className="h-3 w-3 mr-1" />
                        Access
                      </Badge>
                    </div>
                    
                    {/* Status indicators */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {activeDishes > 0 && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          {activeDishes} Active
                        </Badge>
                      )}
                      {totalRestaurantCategories > 0 && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                          {totalRestaurantCategories} Categories
                        </Badge>
                      )}
                    </div>
                    
                    {/* Value indicator */}
                    {restaurantValue > 0 && (
                      <div className="absolute bottom-3 right-3">
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          ${restaurantValue.toFixed(0)}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-lg leading-tight font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                          {restaurant.name}
                        </CardTitle>
                        {restaurant.tagline && (
                          <p className="text-sm text-gray-500 italic line-clamp-1">
                            {restaurant.tagline}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">Access since {new Date(restaurant.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/restaurants/${restaurant.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Restaurant
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/restaurants/${restaurant.id}/dishes`}>
                              <ChefHat className="h-4 w-4 mr-2" />
                              Manage Dishes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/restaurants/${restaurant.id}/menu`}>
                              <Utensils className="h-4 w-4 mr-2" />
                              Manage Menu
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link 
                              href={`/restaurant/${restaurant.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Public Page
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <RemoveUserRestaurantButton
                              userId={user.id}
                              restaurantIds={user.restaurants.map((res: any) => res.id)}
                              restaurantId={restaurant.id}
                            />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-gray-600">
                          <ChefHat className="h-3 w-3" />
                          <span className="text-xs">{totalRestaurantDishes} dish{totalRestaurantDishes !== 1 ? 'es' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Target className="h-3 w-3" />
                          <span className="text-xs">{totalRestaurantCategories} categories</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Users className="h-3 w-3" />
                          <span className="text-xs">{coManagers + 1} manager{coManagers > 0 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-xs">${restaurantValue.toFixed(0)} value</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Button 
                        asChild 
                        variant="outline" 
                        className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50"
                        size="sm"
                      >
                        <Link href={`/admin/restaurants/${restaurant.id}/edit`}>
                          <Settings className="h-4 w-4 mr-2" />
                          Manage
                        </Link>
                      </Button>
                      <Button 
                        asChild 
                        variant="outline" 
                        className="flex-1 border-green-200 text-green-600 hover:bg-green-50"
                        size="sm"
                      >
                        <Link href={`/admin/restaurants/${restaurant.id}/dishes`}>
                          <ChefHat className="h-4 w-4 mr-2" />
                          Dishes
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
