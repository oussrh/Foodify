import Link from 'next/link'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  QrCode, 
  ExternalLink, 
  Copy, 
  Eye, 
  Users, 
  TrendingUp, 
  Calendar,
  Globe,
  Share2,
  BarChart3,
  Smartphone,
  Camera,
  Building2
} from 'lucide-react'
import Image from 'next/image'
import QRCodeDisplay from '@/components/qr-code-display'

export default async function RestaurantInfoPage({
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
    where: { 
      id, 
      users: { some: { email: session.user.email } } 
    },
    include: {
      dishes: {
        include: {
          views: {
            select: {
              id: true,
              viewedAt: true,
              deviceType: true,
              arViewed: true
            }
          }
        }
      }
    }
  })

  if (!restaurant) {
    redirect('/manager/restaurants')
  }

  // Calculate analytics
  const totalViews = restaurant.dishes.reduce((acc, dish) => acc + dish.views.length, 0)
  const arViews = restaurant.dishes.reduce((acc, dish) => 
    acc + dish.views.filter(view => view.arViewed).length, 0
  )
  const uniqueDevices = new Set(restaurant.dishes.flatMap(dish => 
    dish.views.map(view => view.deviceType)
  )).size
  
  // Get views from last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentViews = restaurant.dishes.reduce((acc, dish) => 
    acc + dish.views.filter(view => new Date(view.viewedAt) > thirtyDaysAgo).length, 0
  )

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://foodify.app'}/restaurant/${restaurant.slug}`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild className="hover:bg-accent">
            <Link href={`/manager/restaurants/${restaurant.id}/edit`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Restaurant
            </Link>
          </Button>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="relative">
              {restaurant.logoUrl ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-border">
                  <Image
                    src={restaurant.logoUrl}
                    alt={restaurant.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="p-3 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl">
                  <Building2 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              )}
              <Badge className="absolute -top-2 -right-2 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 text-xs">
                Manager
              </Badge>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                Public Page Analytics
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <span className="font-medium">{restaurant.name}</span>
                <span>•</span>
                <span className="font-mono text-sm">{restaurant.slug}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                QR code, public link, and analytics for your restaurant's public page
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - QR Code & Links */}
        <div className="lg:col-span-1 space-y-6">
          {/* QR Code */}
          <Card className="shadow-lg border-border">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <QrCode className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center space-y-4">
              <QRCodeDisplay 
                url={publicUrl}
                restaurantName={restaurant.name}
              />
              <p className="text-sm text-muted-foreground">
                Customers can scan this QR code to view your menu
              </p>
              <Button variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </CardContent>
          </Card>

          {/* Public Links */}
          <Card className="shadow-lg border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                Public Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Public Menu URL</label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-muted border border-border rounded-md text-sm font-mono text-muted-foreground break-all">
                    {publicUrl}
                  </div>
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button asChild className="w-full">
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Page
                </a>
              </Button>
              <Button variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share Link
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-md border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                    <p className="text-2xl font-bold text-foreground">{totalViews.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Camera className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">AR Views</p>
                    <p className="text-2xl font-bold text-foreground">{arViews.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last 30 Days</p>
                    <p className="text-2xl font-bold text-foreground">{recentViews.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Smartphone className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Devices</p>
                    <p className="text-2xl font-bold text-foreground">{uniqueDevices}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <Card className="shadow-lg border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                Analytics Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Engagement Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">AR Engagement Rate</span>
                      <span className="font-medium text-foreground">
                        {totalViews > 0 ? Math.round((arViews / totalViews) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Dishes</span>
                      <span className="font-medium text-foreground">
                        {restaurant.dishes.filter(d => d.isActive).length} / {restaurant.dishes.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="font-medium text-foreground">
                        {new Date(restaurant.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Top Performing Dishes</h4>
                  <div className="space-y-2">
                    {restaurant.dishes
                      .sort((a, b) => b.views.length - a.views.length)
                      .slice(0, 3)
                      .map((dish) => (
                        <div key={dish.id} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 truncate pr-2">
                            {dish.nameEn}
                          </span>
                          <span className="font-medium text-sm">
                            {dish.views.length} views
                          </span>
                        </div>
                      ))}
                    {restaurant.dishes.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No dishes yet</p>
                    )}
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