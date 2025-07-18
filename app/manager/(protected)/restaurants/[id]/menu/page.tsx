import Link from 'next/link'
import ManagerCategoryManager from '@/components/manager-category-manager'
import { getMenu } from '@/app/actions/menu-actions'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ChefHat, 
  FolderTree, 
  Plus, 
  ArrowLeft,
  Menu as MenuIcon,
  BarChart3,
  Settings,
  TrendingUp,
  Users,
  Globe,
  Lightbulb,
  Target,
  Star,
  Layout
} from 'lucide-react'

export default async function MenuPage({
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
      dishes: {
        select: {
          id: true,
          nameEn: true,
          isActive: true,
          subcategoryId: true
        }
      }
    }
  })

  if (!restaurant) {
    redirect('/manager/restaurants')
  }

  const data = await getMenu(id)
  
  // Calculate statistics
  const totalDishes = restaurant?.dishes?.length || 0
  const activeDishes = restaurant?.dishes?.filter(d => d.isActive).length || 0
  const totalCategories = data.length
  const totalSubcategories = data.reduce((sum, cat) => sum + cat.subcategories.length, 0)
  const dishesWithCategory = restaurant?.dishes?.filter(d => d.subcategoryId).length || 0
  const uncategorizedDishes = totalDishes - dishesWithCategory
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild className="hover:bg-orange-50">
            <Link href={`/manager/restaurants/${id}/edit`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Restaurant
            </Link>
          </Button>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
              <MenuIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Menu Organization</h1>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">{restaurant?.name}</span>
                <span>•</span>
                <span>{totalCategories} categories</span>
                <span>•</span>
                <span>{totalDishes} dishes</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Organize your menu structure with categories and manage dish organization
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" asChild className="border-green-200 text-green-600 hover:bg-green-50">
              <Link href={`/manager/restaurants/${id}/dishes`}>
                <ChefHat className="h-4 w-4 mr-2" />
                View All Dishes
              </Link>
            </Button>
            <Button size="sm" asChild className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600">
              <Link href={`/manager/restaurants/${id}/dishes/create`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Dish
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-fit">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview & Stats
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Organize Categories
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                    <p className="text-xs text-purple-600 mt-1">{totalSubcategories} subcategories</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FolderTree className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Organized</p>
                    <p className="text-3xl font-bold text-gray-900">{dishesWithCategory}</p>
                    <p className="text-xs text-blue-600 mt-1">dishes categorized</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Layout className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Uncategorized</p>
                    <p className="text-3xl font-bold text-gray-900">{uncategorizedDishes}</p>
                    <p className="text-xs text-orange-600 mt-1">need organizing</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Target className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-green-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Button asChild className="h-auto p-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                      <Link href={`/manager/restaurants/${id}/dishes`}>
                        <div className="text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <ChefHat className="h-5 w-5" />
                            <span className="font-semibold">Manage Dishes</span>
                          </div>
                          <p className="text-xs opacity-90">View, edit, and organize all dishes</p>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button asChild variant="outline" className="h-auto p-4 border-purple-200 hover:bg-purple-50">
                      <Link href={`/manager/restaurants/${id}/dishes/create`}>
                        <div className="text-left">
                          <div className="flex items-center gap-2 mb-1 text-purple-600">
                            <Plus className="h-5 w-5" />
                            <span className="font-semibold">Add New Dish</span>
                          </div>
                          <p className="text-xs text-purple-500">Create a new dish for your menu</p>
                        </div>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Category Overview */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <FolderTree className="h-5 w-5 text-purple-600" />
                    Category Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {data.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="p-4 bg-gray-50 rounded-xl mb-4 inline-block">
                        <FolderTree className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">No categories yet</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Start organizing your menu by creating categories
                      </p>
                      <Badge variant="outline" className="text-purple-600 border-purple-200">
                        Switch to &ldquo;Organize Categories&rdquo; tab to get started
                      </Badge>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.map((category, index) => (
                        <div key={category.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{category.nameEn}</h4>
                              {category.nameFr && (
                                <p className="text-sm text-gray-500 italic">{category.nameFr}</p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-purple-600 border-purple-200">
                              {category.subcategories.length} subcategory{category.subcategories.length !== 1 ? 'ies' : 'y'}
                            </Badge>
                          </div>
                          {category.subcategories.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {category.subcategories.slice(0, 3).map((sub) => (
                                <Badge key={sub.id} variant="secondary" className="text-xs">
                                  {sub.nameEn}
                                </Badge>
                              ))}
                              {category.subcategories.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{category.subcategories.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Tips & Info */}
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    Menu Organization Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Clear Categories</p>
                        <p className="text-xs text-gray-500">Group similar dishes together for easy navigation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Logical Order</p>
                        <p className="text-xs text-gray-500">Arrange categories in the order customers expect</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Regular Review</p>
                        <p className="text-xs text-gray-500">Update your menu structure as you add new dishes</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    Manager Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                          Manager
                        </Badge>
                      </div>
                      <p className="text-sm text-orange-700">
                        <strong>Full Control:</strong> You can create, edit, and organize categories and subcategories.
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Organization:</strong> Use drag & drop to reorder categories and keep your menu structured.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-6">
          <ManagerCategoryManager initialData={data} restaurantId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
