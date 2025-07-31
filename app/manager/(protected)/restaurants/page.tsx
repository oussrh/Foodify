import Link from 'next/link'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { CardContextMenu, CardContextMenuItem } from '@/components/card-context-menu'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MoreVertical, 
  Building2, 
  Edit, 
  Utensils, 
  ChefHat,
  Globe,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Users,
  ExternalLink,
  Settings,
  Menu
} from 'lucide-react'
import Image from 'next/image'

export default async function ManagerRestaurantsPage() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }
  const restaurants = await prisma.restaurant.findMany({
    where: { users: { some: { email: session.user.email } } },
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
      },
      users: {
        where: {
          role: 'RESTAURANT_ADMIN'
        },
        select: {
          id: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl">
            <Building2 className="h-8 w-8 text-orange-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">My Restaurants</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="font-medium">{restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>Manager Access</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Manage your assigned restaurants with full operational control
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
              Manager Portal
            </Badge>
          </div>
        </div>
      </div>

      {/* Restaurants Grid */}
      {restaurants.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-6">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-orange-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">No restaurants assigned</h3>
                <p className="text-muted-foreground max-w-sm">
                  You don&apos;t have access to any restaurants yet. Contact your administrator to get restaurant access.
                </p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
                <p className="text-sm text-blue-700">
                  <strong>Need access?</strong> Ask your system administrator to assign you to a restaurant as a manager.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant: any) => {
            const activeDishes = restaurant.dishes.filter((d: any) => d.isActive).length
            const totalDishes = restaurant.dishes.length
            const totalCategories = restaurant.categories.length
            const totalManagers = restaurant.users.length
            
            return (
              <Card key={restaurant.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 relative">
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
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-100 to-red-100">
                      <div className="text-center space-y-2">
                        <Building2 className="h-12 w-12 text-orange-500 mx-auto" />
                        <span className="text-sm text-orange-600 font-medium">No logo</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Manager badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                      Manager
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
                      <CardTitle className="text-lg leading-tight font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
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
                    <CardContextMenu>
                      <CardContextMenuItem>
                        <Link href={`/manager/restaurants/${restaurant.id}/edit`} className="flex items-center w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Restaurant
                        </Link>
                      </CardContextMenuItem>
                      <CardContextMenuItem>
                        <Link href={`/manager/restaurants/${restaurant.id}/dishes`} className="flex items-center w-full">
                          <ChefHat className="h-4 w-4 mr-2" />
                          Manage Dishes
                        </Link>
                      </CardContextMenuItem>
                      <CardContextMenuItem>
                        <Link href={`/manager/restaurants/${restaurant.id}/menu`} className="flex items-center w-full">
                          <Menu className="h-4 w-4 mr-2" />
                          Manage Menu
                        </Link>
                      </CardContextMenuItem>
                      <CardContextMenuItem>
                        <Link 
                          href={`/restaurant/${restaurant.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center w-full"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Public Page
                        </Link>
                      </CardContextMenuItem>
                    </CardContextMenu>
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
                        <span className="text-xs">{totalManagers} manager{totalManagers !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {restaurant.email && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs truncate">{restaurant.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-gray-600">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-xs">{totalCategories} categories</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Button 
                      asChild 
                      variant="outline" 
                      className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                      size="sm"
                    >
                      <Link href={`/manager/restaurants/${restaurant.id}/edit`}>
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
                      <Link href={`/manager/restaurants/${restaurant.id}/dishes`}>
                        <ChefHat className="h-4 w-4 mr-2" />
                        Dishes
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created {new Date(restaurant.createdAt).toLocaleDateString()}</span>
                      </div>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
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
      )}
    </div>
  )
}
