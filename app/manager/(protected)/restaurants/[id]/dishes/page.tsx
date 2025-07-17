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
import { MoreVertical, Plus, Eye, EyeOff, Edit, Trash2 } from 'lucide-react'
import Image from 'next/image'

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
          <Link href={`/manager/restaurants/${id}/dishes/create`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Dish
          </Link>
        </Button>
      </div>

      {/* Dishes Grid */}
      {dishes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No dishes yet</h3>
                <p className="text-muted-foreground">
                  Get started by creating your first dish.
                </p>
              </div>
              <Button asChild>
                <Link href={`/manager/restaurants/${id}/dishes/create`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Dish
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish) => (
            <Card key={dish.id} className="overflow-hidden">
              <div className="aspect-video relative bg-muted">
                {dish.imageUrl ? (
                  <Image
                    src={dish.imageUrl}
                    alt={dish.nameEn}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-muted-foreground">No image</span>
                  </div>
                )}
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg leading-tight">
                      {dish.nameEn}
                    </CardTitle>
                    {dish.nameFr && (
                      <p className="text-sm text-muted-foreground">
                        {dish.nameFr}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/manager/restaurants/${id}/dishes/${dish.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        {dish.isActive ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Show
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    ${Number(dish.price).toFixed(2)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={dish.isActive ? 'default' : 'secondary'}>
                      {dish.isActive ? 'Active' : 'Hidden'}
                    </Badge>
                    {dish.isMostPurchased && (
                      <Badge variant="outline">Popular</Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  {dish.subcategory && (
                    <p className="text-muted-foreground">
                      <span className="font-medium">Category:</span>{' '}
                      {dish.subcategory.category.nameEn} → {dish.subcategory.nameEn}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    <span className="font-medium">Views:</span>{' '}
                    {dish._count.views}
                  </p>
                  {dish.calories && (
                    <p className="text-muted-foreground">
                      <span className="font-medium">Calories:</span>{' '}
                      {dish.calories}
                    </p>
                  )}
                </div>
                
                {dish.descriptionEn && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {dish.descriptionEn}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}