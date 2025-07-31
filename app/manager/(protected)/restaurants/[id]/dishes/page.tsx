import Link from 'next/link'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CardContextMenu, CardContextMenuItem } from '@/components/card-context-menu'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MoreVertical, Plus, Edit, Eye, EyeOff, Star, TrendingUp, ChefHat, Search, Grid3X3, List } from 'lucide-react'
import Image from 'next/image'
import { DishStatusToggle, MostPurchasedToggle, PriceEditor } from '@/components/dish-actions'

export default async function DishesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ search?: string; view?: string }>
}) {
  const { id } = await params
  const sp = searchParams ? await searchParams : undefined
  const searchQuery = sp?.search || ''
  const viewMode = sp?.view || 'grid'
  const session = await auth()
  
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, users: { some: { email: session.user.email } } },
  })

  if (!restaurant) {
    redirect('/manager/restaurants')
  }

  const dishes = await prisma.dish.findMany({
    where: { 
      restaurantId: restaurant.id,
      OR: searchQuery ? [
        {
          nameEn: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          nameFr: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          descriptionEn: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          descriptionFr: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          subcategory: {
            nameEn: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
        },
        {
          subcategory: {
            category: {
              nameEn: {
                contains: searchQuery,
                mode: 'insensitive',
              },
            },
          },
        },
      ] : undefined,
    },
    include: {
      subcategory: {
        include: {
          category: true
        }
      },
      views: true,
      _count: {
        select: {
          views: true
        }
      }
    },
    orderBy: { sortOrder: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dishes</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Manage dishes for {restaurant.name}</span>
            <span>•</span>
            <span>{dishes.length} dish{dishes.length !== 1 ? 'es' : ''}</span>
            {searchQuery && (
              <>
                <span>•</span>
                <span>Filtered by &ldquo;{searchQuery}&rdquo;</span>
              </>
            )}
          </div>
        </div>
        <Button asChild className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
          <Link href={`/manager/restaurants/${id}/dishes/create` as any}>
            <Plus className="h-4 w-4 mr-2" />
            Add Dish
          </Link>
        </Button>
      </div>

      {/* Search and Controls */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-orange-600" />
            Search & Filter Dishes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <form
              className="flex max-w-md items-center gap-3 flex-1"
              action={`/manager/restaurants/${id}/dishes`}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  name="search"
                  placeholder="Search dishes by name, description, category..."
                  defaultValue={searchQuery}
                  className="pl-10 border-gray-200 focus:border-orange-400"
                />
              </div>
              <input type="hidden" name="view" value={viewMode} />
              <Button 
                variant="outline" 
                type="submit"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </form>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">View:</span>
              <div className="flex items-center border border-gray-200 rounded-lg p-1">
                <Link 
                  href={`/manager/restaurants/${id}/dishes?${new URLSearchParams({ ...(searchQuery && { search: searchQuery }), view: 'grid' }).toString()}`}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Link>
                <Link 
                  href={`/manager/restaurants/${id}/dishes?${new URLSearchParams({ ...(searchQuery && { search: searchQuery }), view: 'list' }).toString()}`}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <List className="h-4 w-4" />
                </Link>
              </div>
            </div>
            
            {searchQuery && (
              <Button 
                variant="ghost" 
                asChild
                className="text-gray-500 hover:text-gray-700"
              >
                <Link href={`/manager/restaurants/${id}/dishes`}>
                  Clear Filter
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dishes Grid */}
      {dishes.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-6">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <ChefHat className="h-10 w-10 text-orange-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {searchQuery ? 'No dishes found' : 'No dishes yet'}
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  {searchQuery 
                    ? `No dishes found matching "${searchQuery}". Try adjusting your search terms.`
                    : 'Start building your menu by adding your first delicious dish. Your customers are waiting to discover what you have to offer.'
                  }
                </p>
              </div>
              {!searchQuery && (
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600" asChild>
                  <Link href={`/manager/restaurants/${id}/dishes/create` as any}>
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Dish
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish) => (
            <Card key={dish.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 relative">
              <div className="aspect-video relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                {dish.imageUrl ? (
                  <>
                    <Image
                      src={dish.imageUrl}
                      alt={dish.nameEn}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="text-center space-y-2">
                      <ChefHat className="h-8 w-8 text-gray-400 mx-auto" />
                      <span className="text-sm text-gray-500">No image</span>
                    </div>
                  </div>
                )}
                
                {/* Status overlay */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {!dish.isActive && (
                    <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hidden
                    </Badge>
                  )}
                  {dish.isMostPurchased && (
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Popular
                    </Badge>
                  )}
                </div>
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {dish.nameEn}
                    </CardTitle>
                    {dish.nameFr && (
                      <p className="text-sm text-gray-500 italic">
                        {dish.nameFr}
                      </p>
                    )}
                  </div>
                  <CardContextMenu>
                    <CardContextMenuItem>
                      <Link href={`/manager/restaurants/${id}/dishes/${dish.id}/edit` as any} className="flex items-center w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </Link>
                    </CardContextMenuItem>
                    <DishStatusToggle dishId={dish.id} isActive={dish.isActive} />
                    <MostPurchasedToggle dishId={dish.id} isMostPurchased={dish.isMostPurchased} />
                    <PriceEditor dishId={dish.id} currentPrice={Number(dish.price)} />
                  </CardContextMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ${Number(dish.price).toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">USD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {dish.isActive ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <Eye className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hidden
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    {dish.subcategory && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                        <span className="text-xs truncate">{dish.subcategory.nameEn}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-gray-600">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs">{dish._count.views} views</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {dish.calories && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        <span className="text-xs">{dish.calories} cal</span>
                      </div>
                    )}
                    {dish.isMostPurchased && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs font-medium">Popular</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {dish.descriptionEn && (
                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                    {dish.descriptionEn}
                  </p>
                )}
                
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  <Link href={`/manager/restaurants/${id}/dishes/${dish.id}/edit` as any}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Dish
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5 text-orange-600" />
              Dish List View
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dish</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dishes.map((dish) => (
                    <tr key={dish.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {dish.imageUrl ? (
                              <Image
                                src={dish.imageUrl}
                                alt={dish.nameEn}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                                <ChefHat className="h-6 w-6 text-orange-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{dish.nameEn}</div>
                            {dish.nameFr && (
                              <div className="text-sm text-gray-500 italic">{dish.nameFr}</div>
                            )}
                            {dish.descriptionEn && (
                              <div className="text-xs text-gray-500 line-clamp-1 max-w-48">{dish.descriptionEn}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {dish.subcategory?.category?.nameEn || 'No Category'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {dish.subcategory?.nameEn || 'No Subcategory'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${Number(dish.price).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">USD</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {dish.isActive ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Hidden
                            </Badge>
                          )}
                          {dish.isMostPurchased && (
                            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Popular
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {dish._count.views}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <CardContextMenu alwaysVisible={true}>
                          <CardContextMenuItem>
                            <Link href={`/manager/restaurants/${id}/dishes/${dish.id}/edit` as any} className="flex items-center w-full">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Details
                            </Link>
                          </CardContextMenuItem>
                          <DishStatusToggle dishId={dish.id} isActive={dish.isActive} />
                          <MostPurchasedToggle dishId={dish.id} isMostPurchased={dish.isMostPurchased} />
                          <PriceEditor dishId={dish.id} currentPrice={Number(dish.price)} />
                        </CardContextMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}