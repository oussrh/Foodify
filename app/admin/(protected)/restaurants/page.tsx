import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MoreVertical, 
  Search, 
  Plus, 
  Building2, 
  Edit, 
  Users, 
  ChefHat, 
  Utensils,
  Globe,
  Mail,
  Phone,
  Calendar,
  Trash2
} from 'lucide-react'
import { AdminRestaurantActions } from '@/components/admin-restaurant-actions'
import Image from 'next/image'

async function getRestaurants(searchQuery: string) {
  return await prisma.restaurant.findMany({
    where: {
      name: {
        contains: searchQuery,
        mode: 'insensitive',
      },
    },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          role: true
        }
      },
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
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string }>
}) {
  const sp = searchParams ? await searchParams : undefined
  const searchQuery = sp?.search || ''
  const restaurants = await getRestaurants(searchQuery)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Restaurant Management</h1>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">{restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}</span>
                {searchQuery && (
                  <>
                    <span>•</span>
                    <span>Filtered by &ldquo;{searchQuery}&rdquo;</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Manage all restaurants with comprehensive administrative controls
              </p>
            </div>
          </div>
          <Button 
            asChild 
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg"
          >
            <Link href="/admin/restaurants/create">
              <Plus className="h-5 w-5 mr-2" />
              Create Restaurant
            </Link>
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-4">
        <form
          className="flex max-w-md items-center gap-3 flex-1"
          action="/admin/restaurants"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              name="search"
              placeholder="Search restaurants by name..."
              defaultValue={searchQuery}
              className="pl-10 h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>
          <Button 
            variant="outline" 
            type="submit"
            className="h-12 px-6 border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </form>
        {searchQuery && (
          <Button 
            variant="ghost" 
            asChild
            className="text-gray-500 hover:text-gray-700"
          >
            <Link href="/admin/restaurants">
              Clear Filter
            </Link>
          </Button>
        )}
      </div>

      {/* Restaurants Grid */}
      {restaurants.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-6">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {searchQuery ? 'No restaurants found' : 'No restaurants yet'}
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  {searchQuery 
                    ? `No restaurants found matching &ldquo;${searchQuery}&rdquo;. Try adjusting your search terms.`
                    : 'Get started by creating your first restaurant to manage menus and dishes.'
                  }
                </p>
              </div>
              {!searchQuery && (
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600" asChild>
                  <Link href="/admin/restaurants/create">
                    <Plus className="h-5 w-5 mr-2" />
                    Create First Restaurant
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => {
            const activeDishes = restaurant.dishes.filter(d => d.isActive).length
            const totalDishes = restaurant.dishes.length
            const managers = restaurant.users.filter(u => u.role === 'RESTAURANT_ADMIN')
            
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
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 to-indigo-100">
                      <div className="text-center space-y-2">
                        <Building2 className="h-12 w-12 text-blue-500 mx-auto" />
                        <span className="text-sm text-blue-600 font-medium">No logo</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Admin badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      Admin
                    </Badge>
                  </div>
                  
                  {/* Status indicators */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {activeDishes > 0 && (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        {activeDishes} Active
                      </Badge>
                    )}
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {restaurant.name}
                      </CardTitle>
                      {restaurant.tagline && (
                        <p className="text-sm text-gray-500 italic line-clamp-1">
                          {restaurant.tagline}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-gray-500">
                        <Globe className="h-3 w-3" />
                        <span className="text-xs font-mono">{restaurant.slug}</span>
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
                          <Link href={`/admin/restaurants/${restaurant.id}/users`}>
                            <Users className="h-4 w-4 mr-2" />
                            Manage Users
                          </Link>
                        </DropdownMenuItem>
                        <AdminRestaurantActions restaurantId={restaurant.id} restaurantName={restaurant.name} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-gray-600">
                        <ChefHat className="h-3 w-3" />
                        <span className="text-xs">{totalDishes} dish{totalDishes !== 1 ? 'es' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="h-3 w-3" />
                        <span className="text-xs">{managers.length} manager{managers.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {restaurant.email && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs truncate">{restaurant.email}</span>
                        </div>
                      )}
                      {restaurant.phone && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{restaurant.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Button 
                      asChild 
                      variant="outline" 
                      className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                      size="sm"
                    >
                      <Link href={`/admin/restaurants/${restaurant.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
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
                  
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Created {new Date(restaurant.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  );
}
