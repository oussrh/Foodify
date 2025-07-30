import Link from 'next/link'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import EditRestaurantForm, { type EditRestaurantValues } from '@/components/edit-restaurant-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Building2, 
  Settings,
  BarChart3,
  Globe,
  Mail,
  Phone,
  Calendar,
  Palette,
  Image as ImageIcon,
  ChefHat,
  Users,
  Menu as MenuIcon,
  ExternalLink,
  TrendingUp,
  Utensils
} from 'lucide-react'
import Image from 'next/image'

export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, users: { some: { email: session.user.email } } },
    include: {
      users: {
        where: {
          role: 'RESTAURANT_ADMIN'
        },
        select: {
          id: true,
          email: true,
          role: true
        }
      },
      dishes: {
        select: {
          id: true,
          nameEn: true,
          isActive: true,
          price: true
        }
      },
      categories: {
        include: {
          subcategories: true
        }
      }
    }
  })

  if (!restaurant) {
    redirect('/manager/restaurants')
  }

  const defaultValues: EditRestaurantValues = {
    name: restaurant.name,
    slug: restaurant.slug,
    email: restaurant.email ?? '',
    phone: restaurant.phone ?? '',
    tagline: restaurant.tagline ?? '',
    logoUrl: restaurant.logoUrl ?? '',
    colorTheme: restaurant.colorTheme ?? '',
    defaultLocale: restaurant.defaultLocale,
    // Address fields
    streetAddress: restaurant.streetAddress ?? '',
    city: restaurant.city ?? '',
    state: restaurant.state ?? '',
    postalCode: restaurant.postalCode ?? '',
    country: restaurant.country ?? '',
    // Business info fields
    website: restaurant.website ?? '',
    description: restaurant.description ?? '',
    cuisineType: restaurant.cuisineType ?? '',
    priceRange: restaurant.priceRange as "$" | "$$" | "$$$" | "$$$$" | undefined,
    openingHours: restaurant.openingHours ?? '',
    socialMedia: restaurant.socialMedia ?? '',
    // Design fields
    coverImageUrl: restaurant.coverImageUrl ?? '',
    coverImageStyle: restaurant.coverImageStyle as "cover" | "repeat" | undefined,
    secondaryColor: restaurant.secondaryColor ?? '',
    fontFamily: restaurant.fontFamily ?? '',
    googleFontUrl: restaurant.googleFontUrl ?? '',
    // Business settings
    currency: restaurant.currency ?? '',
    currencySymbol: restaurant.currencySymbol ?? '',
  }

  const activeDishes = restaurant?.dishes?.filter((d: any) => d.isActive).length || 0
  const totalDishes = restaurant?.dishes?.length || 0
  const managers = restaurant?.users?.length || 0
  const totalCategories = restaurant?.categories?.length || 0
  const totalSubcategories = restaurant?.categories?.reduce((acc: number, cat: any) => acc + cat.subcategories.length, 0) || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild className="hover:bg-orange-50">
            <Link href="/manager/restaurants">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Restaurants
            </Link>
          </Button>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="relative">
              {restaurant.logoUrl ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200">
                  <Image
                    src={restaurant.logoUrl}
                    alt={restaurant.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl">
                  <Building2 className="h-8 w-8 text-orange-600" />
                </div>
              )}
              <Badge className="absolute -top-2 -right-2 bg-orange-100 text-orange-700 border-orange-200 text-xs">
                Manager
              </Badge>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">{restaurant.name}</h1>
              <div className="flex items-center gap-4 text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <span className="font-mono text-sm">{restaurant.slug}</span>
                </div>
                {restaurant.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{restaurant.email}</span>
                  </div>
                )}
                {restaurant.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{restaurant.phone}</span>
                  </div>
                )}
              </div>
              {restaurant.tagline && (
                <p className="text-gray-500 italic">{restaurant.tagline}</p>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                <Calendar className="h-3 w-3" />
                <span>Created {new Date(restaurant.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" asChild className="border-blue-200 text-blue-600 hover:bg-blue-50">
              <Link href={`/manager/restaurants/${restaurant.id}/info`}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Public Info & QR
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="border-green-200 text-green-600 hover:bg-green-50">
              <Link href={`/manager/restaurants/${restaurant.id}/dishes`}>
                <ChefHat className="w-4 h-4 mr-2" />
                Manage Dishes
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="border-purple-200 text-purple-600 hover:bg-purple-50">
              <Link href={`/manager/restaurants/${restaurant.id}/menu`}>
                <MenuIcon className="w-4 h-4 mr-2" />
                Manage Menu
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
              <Link 
                href={`/restaurant/${restaurant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Public
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Left Column - Restaurant Form */}
        <div className="xl:col-span-2 space-y-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-orange-600" />
                Restaurant Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <EditRestaurantForm id={restaurant.id} defaultValues={defaultValues} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats & Overview */}
        <div className="space-y-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Restaurant Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{totalDishes}</div>
                  <div className="text-sm text-green-600 font-medium">Total Dishes</div>
                  <div className="text-xs text-green-500 mt-1">{activeDishes} active</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="text-2xl font-bold text-purple-700">{totalCategories}</div>
                  <div className="text-sm text-purple-600 font-medium">Categories</div>
                  <div className="text-xs text-purple-500 mt-1">{totalSubcategories} subcategories</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <div className="text-2xl font-bold text-orange-700">{managers}</div>
                  <div className="text-sm text-orange-600 font-medium">Managers</div>
                  <div className="text-xs text-orange-500 mt-1">Restaurant admins</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">
                    {restaurant.dishes?.reduce((total: number, dish: any) => total + Number(dish.price), 0).toFixed(0) || 0}
                  </div>
                  <div className="text-sm text-blue-600 font-medium">Total Value</div>
                  <div className="text-xs text-blue-500 mt-1">All dishes combined</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">Configuration</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Default Locale
                    </span>
                    <span className="text-sm font-medium text-gray-900 uppercase">
                      {restaurant.defaultLocale}
                    </span>
                  </div>
                  {restaurant.colorTheme && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Color Theme
                      </span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border border-gray-300" 
                          style={{ backgroundColor: restaurant.colorTheme }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900 font-mono">
                          {restaurant.colorTheme}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Logo
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {restaurant.logoUrl ? 'Configured' : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Button 
                  asChild 
                  className="w-full justify-start bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <Link href={`/manager/restaurants/${restaurant.id}/dishes`}>
                    <ChefHat className="h-4 w-4 mr-3" />
                    Manage Dishes
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full justify-start border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <Link href={`/manager/restaurants/${restaurant.id}/menu`}>
                    <Utensils className="h-4 w-4 mr-3" />
                    Organize Menu
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full justify-start border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Link 
                    href={`/restaurant/${restaurant.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-3" />
                    Preview Public Page
                  </Link>
                </Button>
              </div>
              
              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-orange-100 rounded">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-sm text-orange-700">
                    <p className="font-medium mb-1">Manager Privileges</p>
                    <p className="text-xs">
                      You have full operational control over this restaurant including dishes, menu organization, and settings management.
                    </p>
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
