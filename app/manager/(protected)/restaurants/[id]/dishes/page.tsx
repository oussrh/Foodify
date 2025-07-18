import Link from 'next/link'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { MoreVertical, Plus, Edit, Eye, EyeOff, Star, TrendingUp, ChefHat } from 'lucide-react'
import Image from 'next/image'
import { DishStatusToggle, MostPurchasedToggle, PriceEditor } from '@/components/dish-actions'

export default async function DishesPage({
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
      }
    }
  })

  if (!restaurant) {
    redirect('/manager/restaurants')
  }

  const dishes = restaurant.dishes

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dishes</h1>
          <p className="text-muted-foreground">
            Manage dishes for {restaurant.name}
          </p>
        </div>
        <Button asChild>
          <Link href={`/manager/restaurants/${id}/dishes/create` as any}>
            <Plus className="h-4 w-4 mr-2" />
            Add Dish
          </Link>
        </Button>
      </div>

      {/* Dishes Grid */}
      {dishes.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-6">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <ChefHat className="h-10 w-10 text-orange-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">No dishes yet</h3>
                <p className="text-muted-foreground max-w-sm">
                  Start building your menu by adding your first delicious dish. Your customers are waiting to discover what you have to offer.
                </p>
              </div>
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600" asChild>
                <Link href={`/manager/restaurants/${id}/dishes/create` as any}>
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Dish
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish) => (
            <Card key={dish.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1">
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/manager/restaurants/${id}/dishes/${dish.id}/edit` as any}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </Link>
                      </DropdownMenuItem>
                      <DishStatusToggle dishId={dish.id} isActive={dish.isActive} />
                      <MostPurchasedToggle dishId={dish.id} isMostPurchased={dish.isMostPurchased} />
                      <PriceEditor dishId={dish.id} currentPrice={Number(dish.price)} />
                    </DropdownMenuContent>
                  </DropdownMenu>
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
      )}
    </div>
  )
}