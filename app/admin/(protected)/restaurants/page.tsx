//PathFile: app/admin/(protected)/restaurants/page.tsx

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Trash2,
  BarChart3,
  Filter,
  Grid3X3,
  List,
  TrendingUp,
  ExternalLink,
  Shield,
  Settings,
  Star,
  Activity,
  Target
} from 'lucide-react'
import { AdminRestaurantActions } from '@/components/admin-restaurant-actions'
import Image from 'next/image'

async function getRestaurants(searchQuery: string) {
  return await prisma.restaurant.findMany({
    where: {
      OR: [
        {
          name: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          tagline: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
      ],
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
          isActive: true,
          price: true
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
  searchParams?: Promise<{ search?: string; view?: string }>
}) {
  const sp = searchParams ? await searchParams : undefined
  const searchQuery = sp?.search || ''
  const viewMode = sp?.view || 'grid'
  const restaurants = await getRestaurants(searchQuery)

  // Calculate statistics
  const totalRestaurants = restaurants.length
  const totalDishes = restaurants.reduce((acc, r) => acc + r.dishes.length, 0)
  const activeDishes = restaurants.reduce((acc, r) => acc + r.dishes.filter(d => d.isActive).length, 0)
  const totalManagers = restaurants.reduce((acc, r) => acc + r.users.filter(u => u.role === 'RESTAURANT_ADMIN').length, 0)
  const totalCategories = restaurants.reduce((acc, r) => acc + r.categories.length, 0)
  const totalValue = restaurants.reduce((acc, r) => acc + r.dishes.reduce((dishAcc, d) => dishAcc + Number(d.price || 0), 0), 0)
  const averageDishesPerRestaurant = totalRestaurants > 0 ? (totalDishes / totalRestaurants).toFixed(1) : '0'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl">
              <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Restaurant Management</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium">{totalRestaurants} restaurant{totalRestaurants !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{totalDishes} dishes</span>
                <span>•</span>
                <span>{totalManagers} managers</span>
                {searchQuery && (
                  <>
                    <span>•</span>
                    <span>Filtered by &ldquo;{searchQuery}&rdquo;</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Manage all restaurants with comprehensive administrative controls
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50">
              <Shield className="h-3 w-3 mr-1" />
              Admin Portal
            </Badge>
            <Button 
              asChild 
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg"
            >
              <Link href="/admin/restaurants/create">
                <Plus className="h-5 w-5 mr-2" />
                Create Restaurant
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Restaurants</p>
                <p className="text-3xl font-bold text-foreground">{totalRestaurants}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Active venues</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Dishes</p>
                <p className="text-3xl font-bold text-foreground">{totalDishes}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">{activeDishes} active</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ChefHat className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Managers</p>
                <p className="text-3xl font-bold text-foreground">{totalManagers}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Restaurant admins</p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-3xl font-bold text-foreground">{totalCategories}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Menu sections</p>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Dishes</p>
                <p className="text-3xl font-bold text-foreground">{averageDishesPerRestaurant}</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Per restaurant</p>
              </div>
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-3xl font-bold text-foreground">${totalValue.toFixed(0)}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">All menus</p>
              </div>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Controls */}
      <Card>
        <CardHeader className="bg-muted/50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            Search & Filter Restaurants
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <form
              className="flex max-w-md items-center gap-3 flex-1"
              action="/admin/restaurants"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search restaurants by name..."
                  defaultValue={searchQuery}
                  className="pl-10"
                />
              </div>
              <input type="hidden" name="view" value={viewMode} />
              <Button 
                variant="outline" 
                type="submit"
                className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </form>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">View:</span>
              <div className="flex items-center border rounded-lg p-1">
                <Link 
                  href={`/admin/restaurants?${new URLSearchParams({ ...(searchQuery && { search: searchQuery }), view: 'grid' }).toString()}`}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Link>
                <Link 
                  href={`/admin/restaurants?${new URLSearchParams({ ...(searchQuery && { search: searchQuery }), view: 'list' }).toString()}`}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <List className="h-4 w-4" />
                </Link>
              </div>
            </div>
            
            {searchQuery && (
              <Button 
                variant="ghost" 
                asChild
                className="text-muted-foreground hover:text-foreground"
              >
                <Link href="/admin/restaurants">
                  Clear Filter
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Restaurants Display */}
      {restaurants.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-6">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
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
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600" asChild>
                  <Link href="/admin/restaurants/create">
                    <Plus className="h-5 w-5 mr-2" />
                    Create First Restaurant
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => {
            const activeDishes = restaurant.dishes.filter(d => d.isActive).length
            const totalDishes = restaurant.dishes.length
            const managers = restaurant.users.filter(u => u.role === 'RESTAURANT_ADMIN')
            const totalCategories = restaurant.categories.length
            const restaurantValue = restaurant.dishes.reduce((acc, d) => acc + Number(d.price || 0), 0)
            
            return (
              <Card key={restaurant.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="aspect-video relative bg-muted overflow-hidden">
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
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                      <div className="text-center space-y-2">
                        <Building2 className="h-12 w-12 text-blue-500 dark:text-blue-400 mx-auto" />
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">No logo</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Admin badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  </div>
                  
                  {/* Status indicators */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {activeDishes > 0 && (
                      <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50">
                        <Activity className="h-3 w-3 mr-1" />
                        {activeDishes} Active
                      </Badge>
                    )}
                    {totalCategories > 0 && (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50">
                        {totalCategories} Categories
                      </Badge>
                    )}
                  </div>
                  
                  {/* Value indicator */}
                  {restaurantValue > 0 && (
                    <div className="absolute bottom-3 right-3">
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50">
                        ${restaurantValue.toFixed(0)}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {restaurant.name}
                      </CardTitle>
                      {restaurant.tagline && (
                        <p className="text-sm text-muted-foreground italic line-clamp-1">
                          {restaurant.tagline}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-muted-foreground">
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
                          <Link href={`/admin/restaurants/${restaurant.id}/menu`}>
                            <Utensils className="h-4 w-4 mr-2" />
                            Manage Menu
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/restaurants/${restaurant.id}/users`}>
                            <Users className="h-4 w-4 mr-2" />
                            Manage Users
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
                        <AdminRestaurantActions restaurantId={restaurant.id} restaurantName={restaurant.name} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ChefHat className="h-3 w-3" />
                        <span className="text-xs">{totalDishes} dish{totalDishes !== 1 ? 'es' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span className="text-xs">{managers.length} manager{managers.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {restaurant.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs truncate">{restaurant.email}</span>
                        </div>
                      )}
                      {restaurant.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
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
                      className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
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
                      className="flex-1 border-green-200 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                      size="sm"
                    >
                      <Link href={`/admin/restaurants/${restaurant.id}/dishes`}>
                        <ChefHat className="h-4 w-4 mr-2" />
                        Dishes
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created {new Date(restaurant.createdAt).toLocaleDateString()}</span>
                      </div>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Link 
                          href={`/restaurant/${restaurant.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5 text-muted-foreground" />
              Restaurant List View
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Restaurant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Stats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {restaurants.map((restaurant) => {
                    const activeDishes = restaurant.dishes.filter(d => d.isActive).length
                    const totalDishes = restaurant.dishes.length
                    const managers = restaurant.users.filter(u => u.role === 'RESTAURANT_ADMIN')
                    const restaurantValue = restaurant.dishes.reduce((acc, d) => acc + Number(d.price || 0), 0)
                    
                    return (
                      <tr key={restaurant.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              {restaurant.logoUrl ? (
                                <Image
                                  src={restaurant.logoUrl}
                                  alt={restaurant.name}
                                  width={48}
                                  height={48}
                                  className="h-12 w-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-foreground">{restaurant.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {restaurant.slug}
                              </div>
                              {restaurant.tagline && (
                                <div className="text-xs text-muted-foreground italic">{restaurant.tagline}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50 text-xs">
                                {totalDishes} dishes
                              </Badge>
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50 text-xs">
                                {activeDishes} active
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50 text-xs">
                                {managers.length} managers
                              </Badge>
                              {restaurantValue > 0 && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50 text-xs">
                                  ${restaurantValue.toFixed(0)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {restaurant.email && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-48">{restaurant.email}</span>
                              </div>
                            )}
                            {restaurant.phone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{restaurant.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(restaurant.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
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
                                <Link href={`/admin/restaurants/${restaurant.id}/users`}>
                                  <Users className="h-4 w-4 mr-2" />
                                  Manage Users
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
                              <AdminRestaurantActions restaurantId={restaurant.id} restaurantName={restaurant.name} />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
