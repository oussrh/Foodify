// FilePath: app/admin/(protected)/page.tsx

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { 
  DollarSign, 
  Building2, 
  Users, 
  Shield, 
  ChefHat,
  Target,
  Crown,
  TrendingUp,
  Calendar,
  Activity,
  BarChart3,
  Settings,
  UserPlus,
  Plus,
  ExternalLink,
  Clock,
  Star,
  ArrowRight,
  Zap,
  Globe,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

async function getDashboardData() {
  const [restaurants, users, admins, dishes, categories] = await Promise.all([
    prisma.restaurant.findMany({
      include: {
        dishes: {
          select: {
            id: true,
            isActive: true,
            price: true
          }
        },
        users: {
          select: {
            id: true,
            role: true
          }
        },
        categories: {
          select: {
            id: true
          }
        }
      }
    }),
    prisma.user.findMany({
      where: { role: 'RESTAURANT_ADMIN' },
      include: {
        restaurants: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.dish.findMany({
      select: {
        id: true,
        isActive: true,
        price: true,
        createdAt: true
      }
    }),
    prisma.menuCategory.findMany({
      select: {
        id: true
      }
    })
  ])

  // Calculate statistics
  const totalRestaurants = restaurants.length
  const totalUsers = users.length + admins.length
  const totalRestaurantAdmins = users.length
  const totalSuperAdmins = admins.length
  const totalDishes = dishes.length
  const activeDishes = dishes.filter(d => d.isActive).length
  const totalCategories = categories.length
  const totalValue = dishes.reduce((acc, dish) => acc + Number(dish.price || 0), 0)
  const averageDishesPerRestaurant = totalRestaurants > 0 ? (totalDishes / totalRestaurants).toFixed(1) : '0'
  
  // Recent activity
  const recentDishes = dishes.filter(dish => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return new Date(dish.createdAt) > oneWeekAgo
  }).length
  
  const recentUsers = users.filter(user => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return new Date(user.createdAt) > oneWeekAgo
  }).length

  return {
    totalRestaurants,
    totalUsers,
    totalRestaurantAdmins,
    totalSuperAdmins,
    totalDishes,
    activeDishes,
    totalCategories,
    totalValue,
    averageDishesPerRestaurant,
    recentDishes,
    recentUsers,
    recentUsersList: users,
    restaurants: restaurants.slice(0, 5)
  }
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData()
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl">
              <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Super Admin Dashboard</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium">{data.totalRestaurants} restaurants</span>
                <span>•</span>
                <span>{data.totalUsers} total users</span>
                <span>•</span>
                <span>{data.totalDishes} dishes</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Complete system overview and administrative control center
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50">
              <Crown className="h-3 w-3 mr-1" />
              Super Admin Portal
            </Badge>
            <Button 
              asChild 
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg"
            >
              <Link href="/admin/restaurants/create">
                <Plus className="h-5 w-5 mr-2" />
                Quick Create
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Statistics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Restaurants</p>
                <p className="text-3xl font-bold text-foreground">{data.totalRestaurants}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Active venues</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-foreground">{data.totalUsers}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">{data.recentUsers} new this week</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Dishes</p>
                <p className="text-3xl font-bold text-foreground">{data.totalDishes}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{data.activeDishes} active</p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <ChefHat className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-3xl font-bold text-foreground">${data.totalValue.toFixed(0)}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">All menus</p>
              </div>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Statistics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Restaurant Admins</p>
                <p className="text-2xl font-bold text-foreground">{data.totalRestaurantAdmins}</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Managing venues</p>
              </div>
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Super Admins</p>
                <p className="text-2xl font-bold text-foreground">{data.totalSuperAdmins}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">System administrators</p>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold text-foreground">{data.totalCategories}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Menu sections</p>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Dishes</p>
                <p className="text-2xl font-bold text-foreground">{data.averageDishesPerRestaurant}</p>
                <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">Per restaurant</p>
              </div>
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <BarChart3 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <Button 
              asChild 
              className="w-full justify-start bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              <Link href="/admin/restaurants/create">
                <Building2 className="h-4 w-4 mr-3" />
                Create Restaurant
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="outline"
              className="w-full justify-start border-green-200 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
            >
              <Link href="/admin/users/create">
                <UserPlus className="h-4 w-4 mr-3" />
                Add Restaurant Admin
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="outline"
              className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Link href="/admin/admins/create">
                <Shield className="h-4 w-4 mr-3" />
                Create Super Admin
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="outline"
              className="w-full justify-start border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20"
            >
              <Link href="/admin/restaurants">
                <Settings className="h-4 w-4 mr-3" />
                Manage All Restaurants
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
                <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                  <ChefHat className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{data.recentDishes} new dishes</p>
                  <p className="text-xs text-muted-foreground">Added this week</p>
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50">
                  New
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg">
                <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded">
                  <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{data.recentUsers} new users</p>
                  <p className="text-xs text-muted-foreground">Joined this week</p>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50">
                  Active
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg">
                <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded">
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">System healthy</p>
                  <p className="text-xs text-muted-foreground">All services running</p>
                </div>
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
              </div>
              
              <Button 
                asChild 
                variant="ghost" 
                className="w-full justify-center text-muted-foreground hover:text-foreground"
              >
                <Link href="/admin/users">
                  View All Activity
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {data.recentUsersList.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent users</p>
                </div>
              ) : (
                <>
                  {data.recentUsersList.map((user: any) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                        <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.restaurants.length} restaurant{user.restaurants.length !== 1 ? 's' : ''}</p>
                      </div>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Link href={`/admin/users/${user.id}/edit`}>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                  
                  <Button 
                    asChild 
                    variant="ghost" 
                    className="w-full justify-center text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    <Link href="/admin/users">
                      View All Users
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Restaurants */}
      <Card>
        <CardHeader className="bg-muted/50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Recent Restaurants
            </CardTitle>
            <Button 
              asChild 
              variant="outline" 
              size="sm"
              className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
            >
              <Link href="/admin/restaurants">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {data.restaurants.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No restaurants found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.restaurants.map((restaurant: any) => {
                const activeDishes = restaurant.dishes.filter((d: any) => d.isActive).length
                const totalDishes = restaurant.dishes.length
                const managers = restaurant.users.filter((u: any) => u.role === 'RESTAURANT_ADMIN').length
                const restaurantValue = restaurant.dishes.reduce((acc: number, d: any) => acc + Number(d.price || 0), 0)
                
                return (
                  <div key={restaurant.id} className="p-4 border rounded-lg hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground truncate">{restaurant.name}</h4>
                        <div className="flex items-center gap-1 text-muted-foreground mt-1">
                          <Globe className="h-3 w-3" />
                          <span className="text-xs">{restaurant.slug}</span>
                        </div>
                      </div>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Link href={`/admin/restaurants/${restaurant.id}/edit`}>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ChefHat className="h-3 w-3" />
                        <span>{totalDishes} dishes</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{managers} managers</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Target className="h-3 w-3" />
                        <span>{restaurant.categories.length} categories</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>${restaurantValue.toFixed(0)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      {activeDishes > 0 && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50 text-xs">
                          {activeDishes} active
                        </Badge>
                      )}
                      {restaurant.categories.length > 0 && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50 text-xs">
                          {restaurant.categories.length} categories
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
